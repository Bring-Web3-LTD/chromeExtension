import { ENV_IFRAME_URL } from "../config";
import getVersion from "../getVersion";
import { OFFERBAR_CONTAINER_ID, IFRAME_ID_PREFIX } from "../constants";
import insertStyleElement from "./insertStyleElement";
import injectFramedIframe from "./injectFramedIframe";
import { contentScriptCleanup } from "./cleanupManager";
import { logger } from "../logger";

interface Query {
    [key: string]: string
}

interface Props {
    query: Query
    styleUrl?: string
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

const injectIFrame = ({ query, styleUrl, themeMode, text, iframeUrl, page, switchWallet, placement, stylesheet, framed }: Props): HTMLIFrameElement => {
    const extensionId = chrome.runtime.id;
    const iframeId = `${IFRAME_ID_PREFIX}-${extensionId}`;
    const element = document.getElementById(iframeId)
    if (element) return element as HTMLIFrameElement;
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;

    // Server builds iframeUrl with its params; client fills in the rest.
    const url = new URL(iframeUrl)
    Object.entries({ extensionId, v: getVersion(), themeMode, textMode: text, switchWallet: String(switchWallet), styleUrl, userId: query.userId })
        .forEach(([key, value]) => value && !url.searchParams.has(key) && url.searchParams.set(key, value))
    if (!url.hash && query.token) url.hash = `token=${encodeURIComponent(query.token)}`
    // Dev override: keep the server-built path/query/fragment, swap the origin
    if (ENV_IFRAME_URL) Object.assign(url, { protocol: new URL(ENV_IFRAME_URL).protocol, host: new URL(ENV_IFRAME_URL).host })
    iframe.src = url.toString()
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
    logger.debug('injecting iframe', { page });
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