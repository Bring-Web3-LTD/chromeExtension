import analytics from "../api/analytics";
import validateDomain from "../api/validateDomain";
import { DAY_MS } from "../constants";
import parseUrl from "../parseUrl";
import storage from "../storage/storage";
import handleActivate from "./activate";
import addQuietDomain from "./addQuietDomain";
import checkPostPurchasePage from "./checkPostPurchasePage";
import getQuietDomain from "./getQuietDomain";
import getRelevantDomain from "./getRelevantDomain";
import getUserId from "./getUserId";
import getWalletAddress from "./getWalletAddress";
import isWhitelisted from "./isWhitelisted";
import sendMessage from "./sendMessage";
import showNotification from "./showNotification";
import { isMsRangeActive } from "./timestampRange";

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

const handleTabEvents = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {
    const validateAndInject = async (urlToCheck: string, tabId: number, tab: chrome.tabs.Tab, isInlineSearch: boolean = false, inlineMatch?: string | string[]) => {

        if (isInlineSearch && tabStates.get(tabId)?.urlSearchStatus == 'succeeded') return;

        const url = parseUrl(urlToCheck);

        const { matched, match, type } = await getRelevantDomain(urlToCheck, isInlineSearch ? 'd' : 'kd');

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
                placement  // Pass placement configuration from payload
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
                type: isInlineSearch ? 'i' : type,
                quietDomains,
                ...(isInlineSearch && {
                    link: urlToCheck,
                    linkMatch: match,
                    urlMatch: inlineMatch
                }),
                ...(!isInlineSearch && {
                    urlMatch: match
                })
            }
        });

        if (!popupData.time) popupData.time = DAY_MS;

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

        const userId = await getUserId()

        const res = await sendMessage(tabId, {
            action: 'INJECT',
            token: popupData.token,
            domain: parseUrl(tab.url!),
            iframeUrl: popupData.iframeUrl,
            userId,
            referrers: popupData.portalReferrers,
            page: popupData.isOfferBar ? 'offerbar' : (phase === 'new' ? '' : phase),
            flowId: popupData.flowId,
            stylesheet: popupData.stylesheet,
            placement: popupData.placement,
            framed: popupData.framed
        });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(popupData.verifiedMatch.match, chrome.runtime.id, 'popup', cashbackPagePath, popupData.quietDomainType, popupData.verifiedMatch.isRegex, popupData.time, tabId)
                    break;
                default:
                    console.error(`Unknown action: ${res.action}`);
                    break;
            }
        }

        if (res?.status !== 'success') {
            analytics({
                type: 'no_popup',
                userId,
                walletAddress: address,
                details: { url: urlToCheck, match, iframeUrl: popupData.iframeUrl, reason: res?.message, status: res?.status },
                flowId: popupData.flowId
            })
        }
    };
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (!tab?.url?.startsWith('http')) return

        const isPopupEnabled = await storage.get('popupEnabled');

        if (!isPopupEnabled) return;

        if (changeInfo.url) {
            tabStates.delete(tabId);
            await checkPostPurchasePage(tab.url);
            validateAndInject(tab.url, tabId, tab, false);
        }

        if (changeInfo.status === 'complete') {
            const inlineSearchResult = await getRelevantDomain(tab.url, "i");
            if (!inlineSearchResult.matched) return;

            const quietInlineSearch = await getQuietDomain(parseUrl(tab.url), "i");
            if (quietInlineSearch.phase === 'quiet') return;

            const response = await sendMessage(tabId, { action: 'GET_PAGE_LINKS' });

            if (response?.status !== 'success' || !response.links?.length) return;

            const uniqueLinks = [...new Set(response.links)] as string[];

            await Promise.allSettled(
                uniqueLinks.map(link => validateAndInject(link, tabId, tab, true, inlineSearchResult.match))
            );
        }
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
        tabStates.delete(tabId);
    });
}

export default handleTabEvents;