import { logger } from "../logger";

// Per-tab main-frame redirect chain (onBeforeRedirect exposes 3xx hop URLs).
// ponytail: in-memory Map, wiped on SW idle; chains complete in seconds.
const chains = new Map<number, string[]>();

const hasWebRequest = typeof chrome !== 'undefined'
    && !!chrome.webRequest
    && typeof chrome.webRequest.onBeforeRedirect?.addListener === 'function';

export const registerRedirectChain = () => {
    if (!hasWebRequest) {
        // Degraded, not broken: without webRequest (permission or host access) no hop
        // is ever seen, so stand-down falls back to testing the landed URL only.
        logger.warn('redirect chain disabled: chrome.webRequest unavailable', {
            reason: 'missing "webRequest" permission or host_permissions for the visited site',
        });
        return;
    }

    // Append each 3xx redirect target.
    chrome.webRequest.onBeforeRedirect.addListener(
        (d) => {
            const chain = chains.get(d.tabId);
            if (chain) chain.push(d.redirectUrl);
            else chains.set(d.tabId, [d.url, d.redirectUrl]);
        },
        { urls: ['<all_urls>'], types: ['main_frame'] }
    );
};

export const getChain = (tabId: number): string[] => chains.get(tabId) || [];

export const clearChain = (tabId: number) => { chains.delete(tabId); };
