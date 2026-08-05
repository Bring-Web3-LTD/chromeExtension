import injectIFrame from "./utils/contentScript/injectIFrame.js";
import handleIframeMessages from "./utils/contentScript/handleIframeMessages.js";
import startListenersForWalletAddress from "./utils/contentScript/startLIstenersForWalletAddress.js";
import getDomain from "./utils/getDomain.js";
import removeTrailingSlash from "./utils/background/removeTrailingSlash.js";
import { contentScriptCleanup } from "./utils/contentScript/cleanupManager.js";
import { IFRAME_ID_PREFIX } from "./utils/constants.js";
import { logger } from "./utils/logger.js";

let iframeEl: IFrame = null
let iframePath: `/${string}` | undefined = undefined
let flowId: string | null = null

// The host page can delete our nodes behind our back, so a flag desyncs;
// presence in the DOM is the only reliable signal.
const isIframeOpen = () => !!document.getElementById(`${IFRAME_ID_PREFIX}-${chrome.runtime.id}`)

// Self-heal: a host whose React root is `document` (e.g. Remix's hydrateRoot(document, …))
// regenerates <html> on hydration recovery, wiping our iframe with it. Hydration happens
// once, early, so a bounded re-inject is enough - not a loop. removeElements() disconnects
// the observer first, so our own teardown paths never trigger a re-inject.
const MAX_REINJECTS = 3
let lastInject: Parameters<typeof injectIFrame>[0] | null = null
let reinjects = 0
let settled = false

// Created on first use: this module is bundled together with the background entry,
// and MutationObserver doesn't exist in a service worker.
let observer: MutationObserver | null = null

// Past load(+2s) the DOM is hydrated; a host still removing our iframe is doing it
// deliberately, so stop. Armed on the first successful INJECT - load has usually
// already fired by the time an activated popup is injected.
const settle = () => setTimeout(() => { settled = true; observer?.disconnect() }, 2000)

const startSelfHeal = (payload: Parameters<typeof injectIFrame>[0]) => {
    lastInject = payload
    reinjects = 0
    if (settled) return
    // First injection only: create the observer and schedule the shutdown.
    if (!observer) {
        observer = new MutationObserver(() => {
            if (isIframeOpen()) return
            if (settled || reinjects >= MAX_REINJECTS || !lastInject) {
                observer?.disconnect()
                return
            }
            reinjects++
            logger.info(`[content] Popup removed by the host page - re-injecting`, { attempt: reinjects })
            contentScriptCleanup.cleanup()
            iframeEl = injectIFrame(lastInject)
        })
        document.readyState === 'complete' ? settle() : window.addEventListener('load', settle, { once: true })
    }
    // subtree catches React replacing the <html> node itself - an observer on
    // documentElement alone would be left watching a detached node.
    observer.observe(document, { childList: true, subtree: true })
}

interface Configuration {
    getWalletAddress: () => Promise<WalletAddress>
    walletAddressUpdateCallback?: (callback: () => void) => void
    walletAddressListeners?: string[]
    promptLogin: () => Promise<void>
    styleUrl?: string
    theme: string
    text: 'upper' | 'lower',
    switchWallet: boolean
}

const removeElements = () => {
    observer?.disconnect()
    iframePath = undefined
    iframeEl = null
    contentScriptCleanup?.cleanup()
}

/**
 * Initializes the content script for the Bring extension.
 * 
 * @async
 * @function bringInitContentScript
 * @param {Object} configuration - The configuration object.
 * @param {Function} configuration.getWalletAddress - A function that returns a Promise resolving to the wallet address.
 * @param {Function} configuration.promptLogin - A function to prompt the user to login.
 * @param {string[]} configuration.walletAddressListeners - An optional array of strings representing wallet address listeners.
 * @param {Function} [configuration.walletAddressUpdateCallback] - An optional callback function for wallet address updates.
 * @param {string} [configuration.styleUrl] - Optional URL to a remote JSON theme file.
 * @param {string} configuration.theme - The chosen theme, light | dark.
 * @param {string} configuration.text - The chosen case for some of the texts, upper | lower.
 * @throws {Error} Throws an error if any required configuration is missing.
 * @returns {Promise<void>}
 * 
 * @description
 * This function sets up event listeners for wallet address changes, iframe messages,
 * and Chrome runtime messages. It handles actions such as getting the wallet address
 * and injecting iframes based on received messages.
 * 
 * @example
 * bringInitContentScript({
 *   getWalletAddress: async () => '0x1234...',
 *   promptLogin: () => { ... },
 *   walletAddressListeners: ["listener1", "listener2"],
 *   theme: 'light',
 *   text: 'lower',
 *   styleUrl: 'https://example.com/theme.json'
 * });
 */
const bringInitContentScript = async ({
    getWalletAddress,
    promptLogin,
    walletAddressListeners,
    walletAddressUpdateCallback,
    styleUrl,
    theme,
    text,
    switchWallet = false
}: Configuration) => {
    if (window.self !== window.top && removeTrailingSlash(window.document.location.origin).endsWith('bringweb3.io')) {
        logger.debug(`[popup-msg] Portal iframe detected - listening for PORTAL_ACTIVATE`, { origin: window.document.location.origin });

        window.addEventListener('message', (e) => {
            if (!e.data || e.data.from !== 'bringweb3' || e.data.action !== 'PORTAL_ACTIVATE') return;

            const { action, domain, extensionId, time, iframeUrl, token, platformName } = e.data

            logger.info(`[popup-msg] ${action} event sent`);
            logger.debug(`[popup-msg] ${action} payload`, { domain, extensionId, time, platformName, source: 'portal', hasToken: !!token });

            chrome.runtime.sendMessage({
                action,
                from: "bringweb3",
                domain,
                extensionId,
                time,
                iframeUrl,
                token,
                source: 'portal',
                platformName
            })
        })
        return
    }

    if (!getWalletAddress || !promptLogin || (!walletAddressListeners?.length && typeof walletAddressUpdateCallback !== 'function')) throw new Error('Missing configuration')

    startListenersForWalletAddress({
        walletAddressListeners,
        walletAddressUpdateCallback,
        getWalletAddress,
        iframeEl
    })

    window.addEventListener('message', (e) => handleIframeMessages({
        event: e,
        iframeEl,
        promptLogin,
        onClose: removeElements
    }))

    // Listen for message
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        if (request?.from !== 'bringweb3') return

        const { action } = request

        switch (action) {

            case 'GET_WALLET_ADDRESS':
                getWalletAddress()
                    .then(walletAddress => sendResponse({ status: 'success', walletAddress }))
                    .catch(err => sendResponse({ status: 'success', walletAddress: undefined }))
                return true
            case 'GET_PAGE_LINKS':
                // Only respond from the main frame, not from iframes
                if (window !== window.top) return false;
                try {
                    const links = Array.from(document.querySelectorAll('a[href]'))
                        .map(a => (a as HTMLAnchorElement).href)
                        .filter(href => href.startsWith('http'));
                    logger.debug(`[content] Scraped page links for inline search`, { count: links.length });
                    sendResponse({ status: 'success', links });
                } catch (error) {
                    logger.error(`[content] Page-links scrape failed`, error);
                    sendResponse({ status: 'failed', links: [] });
                }
                return true
            case 'CLOSE_POPUP':
                if (iframeEl && iframePath === request.path && getDomain(location.href) === getDomain(request.domain)) {
                    logger.info(`[content] CLOSE_POPUP event received — popup closed`);
                    logger.debug(`[content] CLOSE_POPUP payload`, { domain: request.domain, path: request.path, flowId });
                    removeElements();
                    sendResponse({ status: 'success', message: 'Popup closed', location: window.document.location.href, flowId })
                } else {
                    logger.debug(`[content] CLOSE_POPUP ignored — domain mismatch or popup not open`, { domain: request.domain, path: request.path });
                    sendResponse({ status: 'failed', message: 'Domain mismatch or iframe not open' })
                }
                return true
            case 'INJECT':
                try {
                    logger.info(`[content] INJECT event received`);
                    logger.debug(`[content] INJECT payload`, { domain: request.domain, page: request.page, isSpaNavigation: request.isSpaNavigation, flowId: request.flowId });
                    const { referrer } = document
                    const referrers = request.referrers || []

                    if (getDomain(location.href) !== getDomain(request.domain)) {
                        logger.info(`[content] No popup — page navigated away before the popup arrived`);
                        logger.debug(`[content] Domain mismatch`, { current: getDomain(location.href), expected: getDomain(request.domain) });
                        sendResponse({ status: 'failed', message: 'Domain already changed' });
                        return true
                    } else if (isIframeOpen()) {
                        // On SPA navigations, pagehide doesn't fire, so close the old popup before injecting.
                        if (request.isSpaNavigation) {
                            logger.debug(`[content] SPA navigation — closing previous popup before re-injecting`);
                            removeElements();
                        } else {
                            logger.info(`[content] No popup — one is already open on this page`);
                            sendResponse({ status: 'failed', message: 'iframe already open' });
                            return true
                        }
                    }

                    const isReferrer = !!referrer && referrers.includes(getDomain(referrer))

                    if (isReferrer && request.page === '') {
                        logger.info(`[content] No popup - cashback already activated by the referring page`);
                        logger.debug(`[content] Referrer match`, { referrer: getDomain(referrer) });
                        sendResponse({ status: 'failed', message: `already activated by ${getDomain(referrer)}`, action: 'activate' });
                        return true
                    }

                    const { token, iframeUrl, userId, placement, framed, stylesheet } = request;

                    const query: { [key: string]: string } = { token }
                    if (userId) query['userId'] = userId

                    const injectPayload: Parameters<typeof injectIFrame>[0] = {
                        query,
                        iframeUrl,
                        styleUrl,
                        themeMode: theme || 'light',
                        text,
                        switchWallet,
                        page: request.page,
                        placement,  // Pass placement configuration from server
                        stylesheet,
                        framed
                    }
                    iframeEl = injectIFrame(injectPayload);
                    iframePath = `/${request.page || ''}`
                    flowId = request.flowId
                    // Only watch a popup that actually landed (placement.selector can miss).
                    if (isIframeOpen()) startSelfHeal(injectPayload)
                    logger.info(`[content] Popup shown (iframe injected)`);
                    logger.debug(`[content] Popup details`, { domain: request.domain, page: request.page, flowId });
                    sendResponse({ status: 'success' });
                    return true
                } catch (error) {
                    logger.error(`[content] Open-popup request failed`, error);
                    if (error instanceof Error) {
                        sendResponse({ status: 'failed', message: error.message });
                    } else {
                        sendResponse({ status: 'failed', message: String(error) });
                    }
                    return true
                }
            default:
                logger.warn(`[content] Unknown action: ${action}`);
                break;
        }
    });

    window.addEventListener('pagehide', () => {
        // Intentionally also on bfcache-persisted pages: onCommitted fires on
        // restore and re-injects a fresh popup rather than resuming a frozen one.
        removeElements()
    })
}

export default bringInitContentScript;