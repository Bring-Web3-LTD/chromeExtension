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
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (!changeInfo.url || !tab?.url?.startsWith('http')) return

        const url = parseUrl(tab.url);

        const isPopupEnabled = await storage.get('popupEnabled');

        if (!isPopupEnabled) return;

        await checkPostPurchasePage(tab.url);

        const { matched, match } = await getRelevantDomain(tab.url);

        if (!matched) {
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return;
        };

        const { phase, payload } = await getQuietDomain(match);

        if (phase === 'new') {
            const now = Date.now();

            const optOut = await storage.get('optOut');

            if (isMsRangeActive(optOut, now)) {
                return;
            } else {
                await storage.remove('optOut')
            }

            const optOutDomains = await storage.get('optOutDomains')

            if (optOutDomains && isMsRangeActive(optOutDomains[match], now)) {
                return;
            }
        } else if (phase === 'activated') {
            const userId = await getUserId()
            const { iframeUrl, token } = payload || {};

            const res = await sendMessage(tabId, {
                action: 'INJECT',
                iframeUrl,
                token,
                domain: url,
                userId,
                page: phase,
            });
            return;
        } else if (phase === 'quiet') {
            // TODO: if(phase === 'quiet') => Purchase-detector
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return
        }

        const address = await getWalletAddress(tabId);

        const { token, isValid, iframeUrl, networkUrl, flowId, time = DAY_MS, portalReferrers } = await validateDomain({
            body: {
                domain: match,
                phase,
                url: tab.url,
                address
            }
        });

        if (isValid === false) {
            addQuietDomain(match, time);
            return;
        }

        if (!await isWhitelisted(networkUrl)) return;

        const userId = await getUserId()

        const res = await sendMessage(tabId, {
            action: 'INJECT',
            token,
            domain: url,
            iframeUrl,
            userId,
            referrers: portalReferrers,
            page: phase === 'new' ? '' : phase,
            flowId
        });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(match, chrome.runtime.id, 'popup', cashbackPagePath, time, tabId)
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
                details: { url: tab.url, match, iframeUrl, reason: res?.message, status: res?.status },
                flowId
            })
        }
    })
}

export default handleUrlChange;