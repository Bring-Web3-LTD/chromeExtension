import analytics from "../api/analytics";
import validateDomain from "../api/validateDomain";
import { DAY_MS } from "../constants";
import { registerRedirectChain, getChain, clearChain } from "./redirectChain";
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
import { logger } from "../logger";

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

// Tracks URLs per tab for each event source to coordinate between onCommitted and onHistoryStateUpdated.
const navUrls = new Map<number, { committed?: string; history?: string }>();

type StandDown = { match: string | string[], type: string } | null;

// Returns the stand-down ('p') hit from the redirect chain, or null. Run once per
// navigation: the chain belongs to the page, not to the links scraped from it.
const findStandDown = async (chain: string[]): Promise<StandDown> => {
    for (const hop of chain) {
        const hit = await getRelevantDomain(hop, 'p');
        if (hit.matched) return { match: hit.match, type: hit.type || 'p' };
    }
    return null;
};

const handleTabEvents = (cashbackPagePath: string | undefined, showNotifications: boolean, notificationCallback: (() => void) | undefined) => {

    registerRedirectChain();

    // Sends an INJECT to the content script and reacts to its response (activate / no_popup analytics).
    // Used both by validateAndInject (normal popup-check) and by the followups engine on a fire-response.
    const injectPopup = async (tabId: number, tab: chrome.tabs.Tab, popupData: any, phase: string, address: WalletAddress, sourceUrl?: string, isSpaNavigation: boolean = false) => {
        const userId = await getUserId()

        logger.info(`[inject] Sending open-popup request to content script`, { tabId, phase, domain: parseUrl(tab.url!), iframeUrl: popupData.iframeUrl, flowId: popupData.flowId, isSpaNavigation });

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

        logger.info(`[inject] Content script replied to open-popup request`, { tabId, phase, status: res?.status, action: res?.action, message: res?.message });

        if (res?.action) {
            switch (res.action) {
                case 'activate':
                    handleActivate(popupData.verifiedMatch.match, chrome.runtime.id, 'popup', cashbackPagePath, popupData.quietDomainType, popupData.verifiedMatch.isRegex, popupData.time, tabId)
                    break;
                default:
                    logger.error(`Unknown action: ${res.action}`);
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

    const validateAndInject = async (urlToCheck: string, tabId: number, tab: chrome.tabs.Tab, isInlineSearch: boolean = false, inlineSearchResult?: { match: string | string[], type?: string }, isSpaNavigation: boolean = false, standDown: StandDown = null) => {

        // Inline search scans every link on the page (often 50-100), mostly non-matching. Logging each one
        // buries the signal, so inline links only log once they actually match; the main URL logs every step.
        if (!isInlineSearch) logger.debug(`[popup-check] Starting popup evaluation`, { tabId, urlToCheck, isSpaNavigation });

        if (isInlineSearch && tabStates.get(tabId)?.urlSearchStatus == 'succeeded') {
            logger.debug(`[popup-check] Skipped inline search — main URL search already succeeded`, { tabId });
            return;
        }

        const url = parseUrl(urlToCheck);

        const { matched, match, type } = await getRelevantDomain(urlToCheck, isInlineSearch ? 's' : 'kd');

        if (!matched) {
            if (!isInlineSearch) {
                logger.info(`[popup-check] No popup — domain not in relevant-domains list`, { tabId, url });
                await showNotification(tabId, cashbackPagePath, url, showNotifications, notificationCallback)
            }
            return;
        };

        logger.debug(`[popup-check] Domain matched`, { tabId, url, match, type, isInlineSearch });

        if (isInlineSearch) {
            const state = tabStates.get(tabId);
            if (state?.inlineSearch?.status === "matched") {
                logger.debug(`[popup-check] Skipped inline search — tab already matched`, { tabId });
                return;
            }
            if (!state) {
                tabStates.set(tabId, { urlSearchStatus: null, inlineSearch: { status: "matched", popupData: null } });
            } else {
                state.inlineSearch = { status: "matched", popupData: null };
            }
        }

        const { phase, payload } = await getQuietDomain(url, type);
        logger.info(`[popup-check] Domain phase resolved`, { tabId, url, phase });

        const matches = [];
        if (isInlineSearch && inlineSearchResult) {
            matches.push({ match: inlineSearchResult.match, type: inlineSearchResult.type || '' });
        }
        matches.push({ match, type: type || '' });

        if (phase === 'new') {
            const now = Date.now();

            const optOut = await storage.get('optOut');

            if (isMsRangeActive(optOut, now)) {
                logger.info(`[popup-check] No popup — user opted out (global cooldown active)`, { tabId, url });
                return;
            } else {
                await storage.remove('optOut')
            }
        } else if (phase === 'activated') {
            logger.info(`[inject] Showing activated popup (post-activation re-show)`, { tabId, url });
            const userId = await getUserId()
            const { iframeUrl, token, placement } = payload || {};

            logger.info(`[inject] Sending open-popup request to content script`, { tabId, phase, domain: url, iframeUrl, isSpaNavigation });

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
            logger.info(`[inject] Content script replied to open-popup request`, { tabId, phase, status: res?.status, action: res?.action, message: res?.message });
            return;
        } else if (phase === 'quiet') {
            // TODO: if(phase === 'quiet') => Purchase-detector
            logger.info(`[popup-check] No popup — domain is quiet phase`, { tabId, url });
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

        // Stand-down: another affiliate already attributed the navigation that
        // led to this page. Computed once per page from its redirect chain (see
        // findStandDown); inline links inherit the page's verdict.
        if (standDown) matches.push(standDown);

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

        logger.info(`[popup-check] Server validation result`, { tabId, url, isValid: popupData?.isValid, networkUrl: popupData?.networkUrl });

        if (!popupData.time) popupData.time = DAY_MS;

        if (Array.isArray(popupData.followups)) {
            armFollowups(popupData.followups, tabId).catch(() => { });
        }

        if (popupData.isValid === false) {
            logger.info(`[popup-check] No popup — server rejected, marking domain quiet`, { tabId, url, match: popupData.verifiedMatch?.match });
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
            if (state?.urlSearchStatus === 'succeeded') {
                logger.debug(`[popup-check] Skipped inline inject — main URL search already succeeded`, { tabId });
                return;
            }
            if (state?.urlSearchStatus === 'pending') {
                logger.debug(`[popup-check] Deferred inline popup — main URL search still pending`, { tabId });
                state.inlineSearch = { status: "matched", popupData };
                return;
            }
        }

        await injectPopup(tabId, tab, popupData, phase, address, urlToCheck, isSpaNavigation);
    };

    // Inline-search: scrape page links after load.
    const onPageComplete = async (tabId: number, url: string, chain: string[] = []) => {
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

        logger.info(`[popup-check] Inline search — checking page links`, { tabId, url, links: uniqueLinks.length });

        // Checked once against the 'i' page's own chain — never per scraped link.
        const standDown = await findStandDown(chain);

        await Promise.allSettled(
            uniqueLinks.map(link => validateAndInject(link, tabId, tab, true, { match: inlineSearchResult.match, type: inlineSearchResult.type }, false, standDown))
        );
    };

    const onMainNavigation = async (tabId: number, url: string, isSpaNavigation: boolean = false, chain: string[] = []) => {
        logger.info(`[flow] Handling navigation`, { tabId, url, isSpaNavigation });
        const isPopupEnabled = await storage.get('popupEnabled');
        if (!isPopupEnabled) {
            logger.debug(`[flow] Skipped — popup disabled by user`, { tabId, url });
            return;
        }

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
                logger.info(`[followup] Eligible — showing followup popup`, { tabId, url, iframeUrl: followupResult.iframeUrl });
                const address = await getWalletAddress(tabId);
                await injectPopup(tabId, tab, followupResult, 'new', address, url, isSpaNavigation);
            } else {
                logger.debug(`[followup] No popup from followup — no iframe or network not whitelisted`, { tabId, url, iframeUrl: followupResult.iframeUrl, networkUrl: followupResult.networkUrl });
            }
        }).catch(error => logger.error(`[followup] Followup handling failed`, error));

        await validateAndInject(url, tabId, tab, false, undefined, isSpaNavigation, await findStandDown(chain));
    };

    // Reset the chain at navigation start (before any 3xx hop), so each
    // top-frame nav — including one that preempts an uncommitted nav —
    // starts fresh and can't inherit a leftover chain.
    chrome.webNavigation.onBeforeNavigate.addListener(({ tabId, frameId }) => {
        if (frameId !== 0) return;
        clearChain(tabId);
    }, { url: [{ schemes: ['http', 'https'] }] });

    // Full navigations — always processes. Snapshot the chain synchronously
    // (complete by commit) so a later navigation clearing it can't wipe the
    // async read. Not cleared here — onPageComplete still needs it.
    chrome.webNavigation.onCommitted.addListener(async ({ tabId, frameId, url }) => {
        if (frameId !== 0) return;
        logger.debug(`[nav] URL changed (full page navigation)`, { tabId, url });
        const chain = getChain(tabId);
        const entry = navUrls.get(tabId);
        entry ? (entry.committed = url) : navUrls.set(tabId, { committed: url });
        onMainNavigation(tabId, url, false, chain).catch(error => logger.error(`[flow] Navigation handling failed`, error));
    }, { url: [{ schemes: ['http', 'https'] }] });

    // SPA navigations — only processes if onCommitted hasn't handled this URL.
    // Route changes fire no request, so the chain still holds this page visit's
    // arrival hops — pass it so SPA routes inherit the same stand-down verdict.
    chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId, url }) => {
        if (frameId !== 0) return;
        if (navUrls.get(tabId)?.committed === url) {
            logger.debug(`[nav] SPA URL change ignored — already handled by full navigation`, { tabId, url });
            return;
        }
        logger.debug(`[nav] URL changed (SPA / history state update)`, { tabId, url });
        const entry = navUrls.get(tabId);
        entry ? (entry.history = url) : navUrls.set(tabId, { history: url });
        onMainNavigation(tabId, url, true, getChain(tabId)).catch(error => logger.error(`[flow] Navigation handling failed`, error));
    }, { url: [{ schemes: ['http', 'https'] }] });

    chrome.webNavigation.onCompleted.addListener(async ({ tabId, frameId, url }) => {
        if (frameId !== 0) return;
        onPageComplete(tabId, url, getChain(tabId)).catch(error => logger.error(`[popup-check] Inline search failed`, error));
    }, { url: [{ schemes: ['http', 'https'] }] });

    chrome.tabs.onRemoved.addListener((tabId) => {
        tabStates.delete(tabId);
        navUrls.delete(tabId);
        clearChain(tabId);
        cleanupTabFollowups(tabId).catch(() => { });
    });
}

export default handleTabEvents;
