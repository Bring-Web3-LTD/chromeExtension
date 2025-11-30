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
import checkOptOutDomain from "./checkOptOutDomain";

const getCleanDomain = (match: string): string => {
    return match.replace(/\\./g, '.').split('/')[0]?.split('\\')[0] || match
}

const handleUrlChange = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (!changeInfo.url || !tab?.url?.startsWith('http')) return

        const url = parseUrl(tab.url);

        const isPopupEnabled = await storage.get('popupEnabled');

        if (!isPopupEnabled) return;

        await checkPostPurchasePage(tab.url);

        const { matched, match } = await getRelevantDomain(tab.url);
        console.log('[Popup Debug] 🔍 URL:', tab.url);
        console.log('[Popup Debug] 🎯 Domain matched:', matched, '| match:', match);

        if (!matched) {
            await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            return;
        };

        const { phase, payload } = await getQuietDomain(match);
        console.log('[Popup Debug] 📊 Phase:', phase, '| payload:', payload);

        if (phase === 'new') {
            const now = Date.now();

            const optOut = await storage.get('optOut');
            const isGlobalOptOut = isMsRangeActive(optOut, now);
            console.log('[Popup Debug] 🚫 Global opt-out active:', isGlobalOptOut);

            if (isGlobalOptOut) {
                console.log('[Popup Debug] ❌ Blocked by global opt-out');
                return;
            } else {
                await storage.remove('optOut')
            }

            // Check if this specific domain/query is opted out (supports regex patterns)
            const urlObj = new URL(tab.url)
            let hostname = urlObj.hostname
            // Remove www prefixes
            hostname = hostname.replace(/^www\./, '').replace(/^www1\./, '').replace(/^www2\./, '')

            // Build query with full path including search parameters for regex matching
            const queryWithParams = hostname + urlObj.pathname + urlObj.search
            const isOptedOut = await checkOptOutDomain(queryWithParams)
            console.log('[Popup Debug] 🔒 Specific opt-out check - query:', queryWithParams);
            console.log('[Popup Debug] 🔒 Is opted out:', isOptedOut);

            if (isOptedOut) {
                console.log('[Popup Debug] ❌ Blocked by specific opt-out');
                return;
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

        const { token, isValid, iframeUrl, networkUrl, flowId, time = DAY_MS, portalReferrers, placement, isOfferLine } = await validateDomain({
            body: {
                domain: match,
                phase,
                url: tab.url,
                address
            }
        });
        console.log('[Popup Debug] 🔐 Validation result - isValid:', isValid, '| isOfferLine:', isOfferLine, '| token:', token ? '✓' : '✗');

        if (isValid === false) {
            console.log('[Popup Debug] ❌ Blocked by validation failure');
            addQuietDomain(match, time);
            return;
        }

        // const whitelisted = await isWhitelisted(networkUrl);
        // if (!whitelisted) {
        //     console.log('[Bring Popup Flow] ❌ Network URL not whitelisted:', networkUrl);
        //     return;
        // }
        // console.log('[Bring Popup Flow] ✅ Network URL whitelisted:', networkUrl);

        const userId = await getUserId()

        // Extract clean domain for OPT_OUT_SPECIFIC (e.g., "google.com" from "google\.com/search\?.*")
        const cleanDomain = getCleanDomain(match)

        console.log('[Popup Debug] 💉 Sending INJECT to content script | page:', isOfferLine ? 'offerline' : (phase === 'new' ? '' : phase));
        const res = await sendMessage(tabId, {
            action: 'INJECT',
            token,
            domain: url,
            iframeUrl,
            userId,
            referrers: portalReferrers,
            page: isOfferLine ? 'offerline' : (phase === 'new' ? '' : phase),
            flowId,
            placement,
            domainPattern: cleanDomain
        });
        console.log('[Popup Debug] 📬 Content script response:', res);

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
            console.log('[Popup Debug] ❌ Popup NOT shown - reason:', res?.message, '| status:', res?.status);
            analytics({
                type: 'no_popup',
                userId,
                walletAddress: address,
                details: { url: tab.url, match, iframeUrl, reason: res?.message, status: res?.status },
                flowId
            })
        } else {
            console.log('[Popup Debug] ✅ Popup shown successfully!');
        }
    })
}

export default handleUrlChange;