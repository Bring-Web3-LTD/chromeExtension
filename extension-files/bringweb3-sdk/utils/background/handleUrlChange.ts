import analytics from "../api/analytics";
import validateDomain from "../api/validateDomain";
import { DAY_MS } from "../constants";
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

const handleUrlChange = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {
    const validateAndInject = async (urlToCheck: string, tabId: number, tab: chrome.tabs.Tab, isInlineSearch: boolean = false) => {
        const url = parseUrl(urlToCheck);

        const { matched, match } = await getRelevantDomain(urlToCheck);

        if (!matched) {
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return;
        };

        const { phase, payload } = await getQuietDomain(url);

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

        const { token, isValid, iframeUrl, networkUrl, flowId, time = DAY_MS, portalReferrers, placement, isOfferLine, verifiedMatch } = await validateDomain({
            body: {
                match: match,
                phase,
                url: tab.url!,
                address,
                isInlineSearch,
                quietDomains
            }
        });

        if (isValid === false) {
            addQuietDomain(verifiedMatch, time);
            return;
        }

        if (!await isWhitelisted(networkUrl)) return;

        const userId = await getUserId()

        const res = await sendMessage(tabId, {
            action: 'INJECT',
            token,
            domain: parseUrl(tab.url!),
            iframeUrl,
            userId,
            referrers: portalReferrers,
            page: isOfferLine ? 'offerline' : (phase === 'new' ? '' : phase),
            flowId,
            placement
        });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(verifiedMatch, chrome.runtime.id, 'popup', cashbackPagePath, time, tabId)
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
                details: { url: urlToCheck, match, iframeUrl, reason: res?.message, status: res?.status },
                flowId
            })
        }
    };
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (!tab?.url?.startsWith('http')) return

        const isPopupEnabled = await storage.get('popupEnabled');

        if (!isPopupEnabled) return;

        if (changeInfo.url) {
            await checkPostPurchasePage(tab.url);
            validateAndInject(tab.url, tabId, tab, false);
        }

        if (changeInfo.status === 'complete') {
            const response = await sendMessage(tabId, { action: 'GET_PAGE_LINKS' });

            if (response?.status !== 'success' || !response.links?.length) return;

            const uniqueLinks = [...new Set(response.links)] as string[];
            
            const tabDomain = new URL(tab.url).hostname.split('.').slice(-2).join('.');
            const externalLinks = uniqueLinks.filter(link => {
                try { return !new URL(link).hostname.endsWith(tabDomain); }
                catch { return false; }
            });

            await Promise.allSettled(
                externalLinks.map(link => validateAndInject(link, tabId, tab, true))
            );
        }
    })
}

export default handleUrlChange;