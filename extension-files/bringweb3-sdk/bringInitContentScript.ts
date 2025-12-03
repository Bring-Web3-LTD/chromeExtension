import injectIFrame from "./utils/contentScript/injectIFrame.js";
import handleIframeMessages from "./utils/contentScript/handleIframeMessages.js";
import startListenersForWalletAddress from "./utils/contentScript/startLIstenersForWalletAddress.js";
import getDomain from "./utils/getDomain.js";
import removeTrailingSlash from "./utils/background/removeTrailingSlash.js";

let iframeEl: IFrame = null
let iframePath: `/${string}` | undefined = undefined
let isIframeOpen = false
let flowId: string | null = null

interface Configuration {
    getWalletAddress: () => Promise<WalletAddress>
    walletAddressUpdateCallback?: (callback: () => void) => void
    walletAddressListeners?: string[]
    promptLogin: () => Promise<void>
    lightTheme?: Style
    darkTheme?: Style
    lightThemeOfferline?: Style
    darkThemeOfferline?: Style
    theme: string
    text: 'upper' | 'lower',
    switchWallet: boolean
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
 * @param {Object} [configuration.lightTheme] - Optional light theme settings for regular popup.
 * @param {Object} [configuration.darkTheme] - Optional dark theme settings for regular popup.
 * @param {Object} [configuration.lightThemeOfferline] - Optional light theme settings for offerline (falls back to lightTheme if not provided).
 * @param {Object} [configuration.darkThemeOfferline] - Optional dark theme settings for offerline (falls back to darkTheme if not provided).
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
 *   lightTheme: { ... },
 *   darkTheme: { ... },
 *   lightThemeOfferline: { ... },  // Optional: specific theme for offerline
 *   darkThemeOfferline: { ... }    // Optional: specific theme for offerline
 * });
 */
const bringInitContentScript = async ({
    getWalletAddress,
    promptLogin,
    walletAddressListeners,
    walletAddressUpdateCallback,
    lightTheme,
    darkTheme,
    lightThemeOfferline,
    darkThemeOfferline,
    theme,
    text,
    switchWallet = false
}: Configuration) => {
    if (window.self !== window.top && removeTrailingSlash(window.document.location.origin).endsWith('bringweb3.io')) {
        // console.log('Running in Bring Web3 iframe, adding activate event listener to:', window.document.location.origin);

        window.addEventListener('message', (e) => {
            if (!e.data || e.data.from !== 'bringweb3' || e.data.action !== 'PORTAL_ACTIVATE') return;

            const { action, domain, extensionId, time, iframeUrl, token, platformName } = e.data

            // console.log(`Received message from Bring's Portal iframe:`, e.data);

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
        promptLogin
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
            case 'CLOSE_POPUP':
                if (iframeEl && iframePath === request.path && getDomain(location.href) === getDomain(request.domain)) {
                    iframeEl.parentNode?.removeChild(iframeEl)
                    isIframeOpen = false
                    iframePath = undefined
                    sendResponse({ status: 'success', message: 'Popup closed', location: window.document.location.href, flowId })
                } else {
                    sendResponse({ status: 'failed', message: 'Domain mismatch or iframe not open' })
                }
                return true
            case 'INJECT':
                try {
                    const { referrer } = document
                    const referrers = request.referrers || []

                    if (getDomain(location.href) !== getDomain(request.domain)) {
                        sendResponse({ status: 'failed', message: 'Domain already changed' });
                        return true
                    } else if (isIframeOpen) {
                        sendResponse({ status: 'failed', message: 'iframe already open' });
                        return true
                    }

                    const isReferrer = !!referrer && referrers.includes(getDomain(referrer))

                    if (isReferrer && request.page === '') {
                        sendResponse({ status: 'failed', message: `already activated by ${getDomain(referrer)}`, action: 'activate' });
                        return true
                    }

                    const { token, iframeUrl, userId, placement, domainPattern } = request;

                    const query: { [key: string]: string } = { token }
                    if (userId) query['userId'] = userId
                    if (domainPattern) query['domainPattern'] = domainPattern

                    // Select appropriate theme based on page type and theme mode
                    let selectedTheme;
                    if (request.page === 'offerline') {
                        // Use offerline-specific theme if available, fallback to regular theme
                        selectedTheme = theme === 'dark' 
                            ? (darkThemeOfferline || darkTheme)
                            : (lightThemeOfferline || lightTheme);
                    } else {
                        // Regular popup theme
                        selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
                    }

                    iframeEl = injectIFrame({
                        query,
                        iframeUrl,
                        theme: selectedTheme,
                        themeMode: theme || 'light',
                        text,
                        switchWallet,
                        page: request.page,
                        placement  // Pass placement configuration from server
                    });

                    isIframeOpen = true
                    iframePath = `/${request.page || ''}`
                    flowId = request.flowId
                    
                    sendResponse({ status: 'success' });
                    return true
                } catch (error) {
                    console.error('[SDK Inject] ❌ Error during injection', error);
                    if (error instanceof Error) {
                        sendResponse({ status: 'failed', message: error.message });
                    } else {
                        sendResponse({ status: 'failed', message: String(error) });
                    }
                    return true
                }
            default:
                console.error(`Unknown action: ${action}`);
                break;
        }
    });
}

export default bringInitContentScript;