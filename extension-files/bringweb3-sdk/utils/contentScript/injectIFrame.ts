import { ENV_IFRAME_URL } from "../config";
import getQueryParams from "../getQueryParams";
import getVersion from "../getVersion";
interface Query {
    [key: string]: string
}

interface Props {
    query: Query
    theme?: Style
    iframeUrl: string
    themeMode: string
    text: 'upper' | 'lower'
    page: string | undefined
    switchWallet: boolean
    placement?: PlacementConfig  // Optional placement configuration from server
}

const injectIFrame = ({ query, theme, themeMode, text, iframeUrl, page, switchWallet, placement }: Props): HTMLIFrameElement => {
    const extensionId = chrome.runtime.id;
    const iframeId = `bringweb3-iframe-${extensionId}`;
    const element = document.getElementById(iframeId)
    const iframeHost = ENV_IFRAME_URL ? `${ENV_IFRAME_URL}${page ? '/' + page : ''}` : iframeUrl
    if (element) return element as HTMLIFrameElement;
    const params = getQueryParams({ query: { ...query, extensionId, v: getVersion(), themeMode, textMode: text, switchWallet: String(switchWallet) } })
    const customStyles = theme ? `&${getQueryParams({ query: theme, prefix: 't' })}` : ''
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.src = encodeURI(`${iframeHost}?${params}${customStyles}`);
    const sandbox = "allow-scripts allow-same-origin"
    iframe.setAttribute('sandbox', sandbox)
    if (page !== 'offerline') {
        iframe.style.position = "fixed";
        iframe.style.right = "8px";
    }
    iframe.scrolling = "no";
    iframe.style.overflow = "hidden";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.borderRadius = "10px";
    iframe.style.border = "none";
    iframe.style.cssText += `z-index: 99999999999999 !important;`;
    if (theme?.popupShadow) iframe.style.boxShadow = theme.popupShadow;
    // Inject iframe with placement configuration
    injectIframeWithPlacement(iframe, placement);
    return iframe
}

/**
 * Injects iframe into the DOM based on placement configuration
 * @param iframe - The iframe element to inject
 * @param placement - Optional placement configuration from server
 */
function injectIframeWithPlacement(iframe: HTMLIFrameElement, placement?: PlacementConfig) {
    // Default to end of document if no placement specified
    if (!placement || placement.location === 'end') {
        document.documentElement.appendChild(iframe);
        return;
    }
    
    // Start of document
    if (placement.location === 'start') {
        document.documentElement.insertBefore(iframe, document.documentElement.firstChild);
        return;
    }
    
    // After or before a specific element
    if ((placement.location === 'after' || placement.location === 'before') && placement.selector) {
        const element = document.querySelector(placement.selector);
        
        // Handle case where selector doesn't exist - fallback to default
        if (!element) {
            document.documentElement.appendChild(iframe);
            return;
        }

        if (placement.location === 'after') {
            // Insert after the element
            element.parentNode?.insertBefore(iframe, element.nextSibling);
        } else {
            // Insert before the element
            element.parentNode?.insertBefore(iframe, element);
        }
        return;
    }
    
    // Fallback to default if placement location is invalid
    document.documentElement.appendChild(iframe);
}

export default injectIFrame;