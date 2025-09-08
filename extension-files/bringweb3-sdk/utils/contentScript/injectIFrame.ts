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
}

const injectIFrame = ({ query, theme, themeMode, text, iframeUrl, page, switchWallet }: Props): HTMLIFrameElement => {
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
    iframe.style.position = "fixed";
    iframe.scrolling = "no";
    iframe.style.overflow = "hidden";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.right = "8px";
    iframe.style.borderRadius = "10px";
    iframe.style.border = "none";
    iframe.style.cssText += `z-index: 99999999999999 !important;`;
    if (theme?.popupShadow) iframe.style.boxShadow = theme.popupShadow;
    document.documentElement.appendChild(iframe);
    return iframe
}

export default injectIFrame;