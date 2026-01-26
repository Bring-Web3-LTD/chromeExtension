import { ENV_IFRAME_URL } from "../config";
import getQueryParams from "../getQueryParams";
import getVersion from "../getVersion";
import { OFFERBAR_CONTAINER_ID, IFRAME_ID_PREFIX } from "../constants";
import insertStyleElement from "./insertStyleElement";
import injectFramedIframe from "./injectFramedIframe";
import { contentScriptCleanup } from "./cleanupManager";
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
    stylesheet?: string
    framed: FrameModeOptions | null
}

const STYLESHEET_ID = 'bring-iframe-stylesheet';

const injectIFrame = ({ query, theme, themeMode, text, iframeUrl, page, switchWallet, placement, stylesheet, framed }: Props): HTMLIFrameElement => {
    const extensionId = chrome.runtime.id;
    const iframeId = `${IFRAME_ID_PREFIX}-${extensionId}`;
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
    iframe.style.position = "fixed";
    iframe.style.right = "8px";
    iframe.scrolling = "no";
    iframe.style.overflow = "hidden";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.borderRadius = "10px";
    iframe.style.border = "none";
    iframe.style.cssText += `z-index: 99999999999999 !important;`;
    if (theme?.popupShadow) iframe.style.boxShadow = theme.popupShadow;

    insertStyleElement(stylesheet, STYLESHEET_ID);

    if (framed) injectFramedIframe(framed);
    // Inject iframe with placement configuration
    injectIframeWithPlacement(iframe, placement, page);
    return iframe
}

/**
 * Injects iframe into the DOM based on placement configuration
 * @param iframe - The iframe element to inject
 * @param placement - Optional placement configuration from server
 * @param page - The page type
 */
function injectIframeWithPlacement(iframe: HTMLIFrameElement, placement?: PlacementConfig, page?: string) {
    console.log({page});
    if (['offerbar','framed'].includes(page || '')) {
        const existingIframe = document.querySelector(`iframe[id^="${IFRAME_ID_PREFIX}-"]`);
        if (existingIframe) return;
    }

    let elementToInject: HTMLElement = iframe;

    if (placement?.parent) {
        let container = document.getElementById(OFFERBAR_CONTAINER_ID) as HTMLElement | null;

        if (!container) {
            container = document.createElement(placement.parent);
            container.id = OFFERBAR_CONTAINER_ID;
        }

        container.appendChild(iframe);
        elementToInject = container;
    }

    // Register cleanup function early, before any injection
    contentScriptCleanup.add(() => {
        // Remove the iframe
        if (iframe && iframe.parentNode) {
            iframe.remove();
        }

        // Remove the container if it was created
        if (placement?.parent) {
            const container = document.getElementById(OFFERBAR_CONTAINER_ID);
            if (container) {
                container.remove();
            }
        }
    });

    // Default to end of document if no placement specified
    if (!placement || placement.location === 'end') {
        document.documentElement.appendChild(elementToInject);
        return;
    }

    // Start of document
    if (placement.location === 'start') {
        document.documentElement.insertBefore(elementToInject, document.documentElement.firstChild);
        return;
    }

    // After or before a specific element
    if ((placement.location === 'after' || placement.location === 'before') && placement.selector) {
        const element = document.querySelector(placement.selector);
        if (!element) return; // Selector not found - don't inject

        const referenceNode = placement.location === 'after' ? element.nextSibling : element;
        element.parentNode?.insertBefore(elementToInject, referenceNode);
        return;
    }

    // Fallback to default if placement location is invalid
    document.documentElement.appendChild(elementToInject);
}

export default injectIFrame;