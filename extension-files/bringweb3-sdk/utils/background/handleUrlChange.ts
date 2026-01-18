import analytics from "../api/analytics";
import validateDomain from "../api/validateDomain";
import { DAY_MS } from "../constants";
import getDomain from "../getDomain";
import parseUrl from "../parseUrl";
import storage from "../storage/storage";
import handleActivate from "./activate";
import addQuietDomain from "./addQuietDomain";
import checkPostPurchasePage from "./checkPostPurhcasePage";
import getQuietDomain from "./getQuietDomain";
import getRelevantDomain from "./getRelevantDomain";
import getUserId from "./getUserId";
import getWalletAddress from "./getWalletAddress";
import isWhitelisted from "./isWhitelisted";
import sendMessage from "./sendMessage";
import showNotification from "./showNotification";
import { isMsRangeActive } from "./timestampRange";

type UrlSearchStatus = 'pending' | 'injected' | 'rejected' | null;

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
        verifiedMatch: string;
    } | null;
}

interface TabState {
    urlSearch: UrlSearchStatus;
    inlineSearch: InlineSearchData | null;
}

const tabStates = new Map<number, TabState>();

const handleUrlChange = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {
    const validateAndInject = async (urlToCheck: string, tabId: number, tab: chrome.tabs.Tab, isInlineSearch: boolean = false, inlineMatch?: string | string[], urlMatch?: string | string[]) => {

        if (isInlineSearch && tabStates.get(tabId)?.urlSearch == 'injected') return;

        const url = parseUrl(urlToCheck);

        const { matched, match, type } = isInlineSearch ? await getRelevantDomain(urlToCheck, "d") : await getRelevantDomain(urlToCheck);

        if (!matched) {
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return;
        };

        if (isInlineSearch) {
            const state = tabStates.get(tabId);
            if (state?.inlineSearch?.status === "matched") {
                return;
            }
            if (!state) {
                tabStates.set(tabId, { urlSearch: null, inlineSearch: { status: "matched", popupData: null } });
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
            tabStates.set(tabId, { urlSearch: null, inlineSearch: null });
        }

        if (!isInlineSearch) {
            tabStates.get(tabId)!.urlSearch = 'pending';
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
                    urlMatch: urlMatch,
                    inlineMatch: inlineMatch
                }),
                ...(!isInlineSearch && {
                    urlMatch: match
                })
            }
        });

        if (!popupData.time) popupData.time = DAY_MS;

        if (popupData.isValid === false) {
            addQuietDomain(popupData.verifiedMatch, popupData.time, popupData.quietDomainType);

            if (isInlineSearch) return;

            const state = tabStates.get(tabId)!;
            state.urlSearch = 'rejected';

            if (!state.inlineSearch?.popupData) return;

            popupData = state.inlineSearch.popupData;
        }

        if (!await isWhitelisted(popupData.networkUrl)) return;

        if (!isInlineSearch) {
            tabStates.get(tabId)!.urlSearch = 'injected';
        } else {
            const state = tabStates.get(tabId);
            if (state?.urlSearch === 'injected') return;
            if (state?.urlSearch === 'pending') {
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
            placement: popupData.placement
        });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(popupData.verifiedMatch, chrome.runtime.id, 'popup', cashbackPagePath, popupData.quietDomainType, popupData.time, tabId)
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

            const urlSearchResult = await getRelevantDomain(tab.url);

            const response = await sendMessage(tabId, { action: 'GET_PAGE_LINKS' });

            if (response?.status !== 'success' || !response.links?.length) return;

            const uniqueLinks = [...new Set(response.links)] as string[];

            await Promise.allSettled(
                uniqueLinks.map(link => validateAndInject(link, tabId, tab, true, inlineSearchResult.match, urlSearchResult.match))
            );
        }
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
        tabStates.delete(tabId);
    });
}

export default handleUrlChange;