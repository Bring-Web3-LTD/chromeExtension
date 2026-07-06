import analytics from "../api/analytics";
import validateDomain from "../api/validateDomain";
import { DAY_MS } from "../constants";
import parseUrl from "../parseUrl";
import storage from "../storage/storage";
import handleActivate from "./activate";
import addQuietDomain from "./addQuietDomain";
import applyQuietDomainsUpdate from "./applyQuietDomainsUpdate";
import { armFollowups, cleanupTabFollowups, processNavigation } from "./followups";
import getQuietDomain from "./getQuietDomain";
import getRelevantDomain from "./getRelevantDomain";
import getUserId from "./getUserId";
import getWalletAddress from "./getWalletAddress";
import isWhitelisted from "./isWhitelisted";
import sendMessage from "./sendMessage";
import showNotification from "./showNotification";
import { isMsRangeActive } from "./timestampRange";
import { log } from "../logger/logger";

type UrlSearchStatus = 'pending' | 'succeeded' | 'failed' | null;

interface InlineSearchData {
    status: "matched" | null;
    popupData: {
        token: string;
        isValid: boolean;
        iframeUrl: string;
        networkUrl: string;
        flowId: string;
        time: number;
        portalReferrers?: string[];
        placement?: any;
        isOfferBar: boolean;
        verifiedMatch: { match: string, isRegex: boolean },
        quietDomainType: string | string[];
    } | null;
}

interface TabState {
    urlSearchStatus: UrlSearchStatus;
    inlineSearch: InlineSearchData | null;
}

const tabStates = new Map<number, TabState>();

const hasWebNavigation = typeof chrome !== 'undefined'
    && chrome.webNavigation
    && typeof chrome.webNavigation.onCommitted?.addListener === 'function';

// Tracks URLs per tab for each event source to coordinate between onCommitted and onHistoryStateUpdated.
const navUrls = new Map<number, { committed?: string; history?: string }>();

const handleTabEvents = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {

    // Sends an INJECT to the content script and reacts to its response (activate / no_popup analytics).
    // Used both by validateAndInject (normal popup-check) and by the followups engine on a fire-response.
    const injectPopup = async (tabId: number, tab: chrome.tabs.Tab, popupData: any, phase: string, address: WalletAddress, sourceUrl?: string, isSpaNavigation: boolean = false) => {
        const userId = await getUserId()

        const res = await sendMessage(tabId, {
            action: 'INJECT',
            token: popupData.token,
            domain: parseUrl(tab.url!),
            iframeUrl: popupData.iframeUrl,
            userId,
            referrers: popupData.portalReferrers,
            page: popupData.framed ? 'framed' : (popupData.isOfferBar ? 'offerbar' : (phase === 'new' ? '' : phase)),
            flowId: popupData.flowId,
            stylesheet: popupData.stylesheet,
            placement: popupData.placement,
            framed: popupData.framed,
            isSpaNavigation
        });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(popupData.verifiedMatch.match, chrome.runtime.id, 'popup', cashbackPagePath, popupData.quietDomainType, popupData.verifiedMatch.isRegex, popupData.time, tabId)
                    break;
                default:
                    log.error(`Unknown action: ${res.action}`);
                    break;
            }
        }

        if (res?.status !== 'success') {
            analytics({
                type: 'no_popup',
                userId,
                walletAddress: address,
                details: { url: sourceUrl ?? tab.url, match: popupData.verifiedMatch?.match, iframeUrl: popupData.iframeUrl, reason: res?.message, status: res?.status },
                flowId: popupData.flowId
            })
        }

        return res;
    };

    const validateAndInject = async (urlToCheck: string, tabId: number, tab: chrome.tabs.Tab, isInlineSearch: boolean = false, inlineSearchResult?: { match: string | string[], type?: string }, isSpaNavigation: boolean = false) => {

        if (isInlineSearch && tabStates.get(tabId)?.urlSearchStatus == 'succeeded') return;

        const url = parseUrl(urlToCheck);

        const { matched, match, type } = await getRelevantDomain(urlToCheck, isInlineSearch ? 's' : 'kd');

        if (!matched) {
            if (!isInlineSearch) await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return;
        };

        if (isInlineSearch) {
            const state = tabStates.get(tabId);
            if (state?.inlineSearch?.status === "matched") {
                return;
            }
            if (!state) {
                tabStates.set(tabId, { urlSearchStatus: null, inlineSearch: { status: "matched", popupData: null } });
            } else {
                state.inlineSearch = { status: "matched", popupData: null };
            }
        }

        const { phase, payload } = await getQuietDomain(url, type);

        const matches = [];
        if (isInlineSearch && inlineSearchResult) {
            matches.push({ match: inlineSearchResult.match, type: inlineSearchResult.type || '' });
        }
        matches.push({ match, type: type || '' });

        if (phase === 'new') {
            const now = Date.now();

            const optOut = await storage.get('optOut');

            if (isMsRangeActive(optOut, now)) {
                return;
            } else {
                await storage.remove('optOut')
            }
        } else if (phase === 'activated') {
            const userId = await getUserId()
            const { iframeUrl, token, placement } = payload || {};

            const res = await sendMessage(tabId, {
                action: 'INJECT',
                iframeUrl,
                token,
                domain: url,
                userId,
                page: phase,
                placement,  // Pass placement configuration from payload
                isSpaNavigation
            });
            return;
        } else if (phase === 'quiet') {
            // TODO: if(phase === 'quiet') => Purchase-detector
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return
        }

        const address = await getWalletAddress(tabId);
        const quietDomains = await storage.get('quietDomains') || [];

        if (!tabStates.has(tabId)) {
            tabStates.set(tabId, { urlSearchStatus: null, inlineSearch: null });
        }

        if (!isInlineSearch) {
            tabStates.get(tabId)!.urlSearchStatus = 'pending';
        }

        let popupData = await validateDomain({
            body: {
                phase,
                url: tab.url!,
                address,
                quietDomains,
                matches
            }
        });

        if (popupData?.quietDomainsChanged === true) {
            await applyQuietDomainsUpdate(popupData.quietDomains);
        }

        if (!popupData.time) popupData.time = DAY_MS;

        if (Array.isArray(popupData.followups)) {
            armFollowups(popupData.followups, tabId).catch(() => { });
        }

        if (popupData.isValid === false) {
            addQuietDomain(popupData.verifiedMatch.match, popupData.time, popupData.quietDomainType, popupData.verifiedMatch.isRegex);

            if (isInlineSearch) return;

            const state = tabStates.get(tabId)!;
            state.urlSearchStatus = 'failed';

            if (!state.inlineSearch?.popupData) return;

            popupData = state.inlineSearch.popupData;
        }

        if (!await isWhitelisted(popupData.networkUrl)) return;

        if (!isInlineSearch) {
            tabStates.get(tabId)!.urlSearchStatus = 'succeeded';
        } else {
            const state = tabStates.get(tabId);
            if (state?.urlSearchStatus === 'succeeded') return;
            if (state?.urlSearchStatus === 'pending') {
                state.inlineSearch = { status: "matched", popupData };
                return;
            }
        }

        await injectPopup(tabId, tab, popupData, phase, address, urlToCheck, isSpaNavigation);
    };

    // Inline-search: scrape page links after load.
    const onPageComplete = async (tabId: number, url: string) => {
        const isPopupEnabled = await storage.get('popupEnabled');
        if (!isPopupEnabled) return;

        const inlineSearchResult = await getRelevantDomain(url, "i");
        if (!inlineSearchResult.matched) return;

        const quietInlineSearch = await getQuietDomain(parseUrl(url), "i");
        if (quietInlineSearch.phase === 'quiet') return;

        const tab = await chrome.tabs.get(tabId);

        const response = await sendMessage(tabId, { action: 'GET_PAGE_LINKS' }, undefined, 0);

        if (response?.status !== 'success' || !response.links?.length) return;

        const uniqueLinks = [...new Set(response.links)] as string[];

        await Promise.allSettled(
            uniqueLinks.map(link => validateAndInject(link, tabId, tab, true, { match: inlineSearchResult.match, type: inlineSearchResult.type }))
        );
    };

    const onMainNavigation = async (tabId: number, url: string, isSpaNavigation: boolean = false) => {
        const isPopupEnabled = await storage.get('popupEnabled');
        if (!isPopupEnabled) return;

        const tab = await chrome.tabs.get(tabId);
        tabStates.delete(tabId);

        // Fire-and-forget: followups run independently of the normal popup flow.
        // The activated popup is allowed to re-show on the post-purchase page.
        processNavigation(tabId, url).then(async (followupResult) => {
            if (!followupResult) return;
            if (Array.isArray(followupResult.followups)) {
                await armFollowups(followupResult.followups, tabId).catch(() => { });
            }
            if (followupResult.iframeUrl && await isWhitelisted(followupResult.networkUrl)) {
                const address = await getWalletAddress(tabId);
                await injectPopup(tabId, tab, followupResult, 'new', address, url, isSpaNavigation);
            }
        }).catch(() => { });

        await validateAndInject(url, tabId, tab, false, undefined, isSpaNavigation);
    };

    if (hasWebNavigation) {
        // Full navigations — always processes.
        chrome.webNavigation.onCommitted.addListener(async ({ tabId, frameId, url }) => {
            if (frameId !== 0) return;
            const entry = navUrls.get(tabId);
            entry ? (entry.committed = url) : navUrls.set(tabId, { committed: url });
            onMainNavigation(tabId, url).catch(() => {});
        }, { url: [{ schemes: ['http', 'https'] }] });

        // SPA navigations — only processes if onCommitted hasn't handled this URL.
        chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId, url }) => {
            if (frameId !== 0) return;
            if (navUrls.get(tabId)?.committed === url) return;
            const entry = navUrls.get(tabId);
            entry ? (entry.history = url) : navUrls.set(tabId, { history: url });
            onMainNavigation(tabId, url, true).catch(() => {});
        }, { url: [{ schemes: ['http', 'https'] }] });

        chrome.webNavigation.onCompleted.addListener(async ({ tabId, frameId, url }) => {
            if (frameId !== 0) return;
            onPageComplete(tabId, url).catch(() => {});
        }, { url: [{ schemes: ['http', 'https'] }] });
    } else {
        // Fallback when webNavigation permission is unavailable.
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (!tab?.url?.startsWith('http')) return;

            if (changeInfo.url) {
                onMainNavigation(tabId, tab.url).catch(() => {});
            }

            if (changeInfo.status === 'complete') {
                onPageComplete(tabId, tab.url).catch(() => {});
            }
        });
    }

    chrome.tabs.onRemoved.addListener((tabId) => {
        tabStates.delete(tabId);
        navUrls.delete(tabId);
        cleanupTabFollowups(tabId).catch(() => { });
    });
}

export default handleTabEvents;
