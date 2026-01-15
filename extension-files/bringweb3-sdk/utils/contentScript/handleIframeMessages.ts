import applyStyles from "./applyStyles"
import addKeyframes from "./addKeyFrames"
import { OFFERLINE_CONTAINER_ID } from "../constants"

interface Props {
    event: BringEvent
    iframeEl: IFrame
    promptLogin: () => Promise<void>
}

const ACTIONS = {
    OPEN: 'OPEN',
    CLOSE: 'CLOSE',
    ACTIVATE: 'ACTIVATE',
    PROMPT_LOGIN: 'PROMPT_LOGIN',
    OPT_OUT: 'OPT_OUT',
    OPT_OUT_SPECIFIC: 'OPT_OUT_SPECIFIC',
    ADD_KEYFRAMES: 'ADD_KEYFRAMES',
    ERASE_NOTIFICATION: 'ERASE_NOTIFICATION',
    OPEN_CASHBACK_PAGE: 'OPEN_CASHBACK_PAGE',
    STOP_REMINDERS: 'STOP_REMINDERS'
}

const UNION_ACTIONS = [ACTIONS.ACTIVATE]

const handleIframeMessages = ({ event, iframeEl, promptLogin }: Props) => {
    if (!event?.data) return

    const { from, action, style, keyFrames, time, extensionId, url, domain, redirectUrl, iframeUrl, token, flowId, platformName, searchTermPattern, type } = event.data
    if (from !== 'bringweb3') return

    // If the event comes from another extension that installed our package, ignore it (unless it ACTIVATE action)
    if (extensionId !== chrome.runtime.id && !UNION_ACTIONS.includes(action)) return

    switch (action) {
        case ACTIONS.OPEN:
            const container = document.getElementById(OFFERLINE_CONTAINER_ID);
            if (container && style && 'parent' in style) {
                applyStyles(container, style.parent);
            }
            if (style && 'iframe' in style) {
                applyStyles(iframeEl, style.iframe);
            }
            break;
        case ACTIONS.CLOSE:
            if (iframeEl) {
                const container = document.getElementById(OFFERLINE_CONTAINER_ID);
                if (container && container.contains(iframeEl)) {
                    container.parentNode?.removeChild(container);
                } else {
                    iframeEl.parentNode?.removeChild(iframeEl);
                }
            }
            if (time) chrome.runtime.sendMessage({ action, time, domain, from: "bringweb3" })
            break;
        case ACTIONS.PROMPT_LOGIN:
            promptLogin()
            break;
        case ACTIONS.ACTIVATE:
            chrome.runtime.sendMessage({ action, from: "bringweb3", domain, extensionId, time, redirectUrl, iframeUrl, token, flowId, platformName })
            break;
        case ACTIONS.OPT_OUT:
            chrome.runtime.sendMessage({ action, time, from: "bringweb3" })
            break;
        case ACTIONS.OPT_OUT_SPECIFIC:
            chrome.runtime.sendMessage({ action, domain, time, type, from: "bringweb3" })
            break;
        case ACTIONS.ERASE_NOTIFICATION:
            chrome.runtime.sendMessage({ action, from: "bringweb3" })
        case ACTIONS.ADD_KEYFRAMES:
            addKeyframes(keyFrames)
            break;
        case ACTIONS.OPEN_CASHBACK_PAGE:
            chrome.runtime.sendMessage({ action, url, from: "bringweb3" })
            break;
        case ACTIONS.STOP_REMINDERS:
            chrome.runtime.sendMessage({ action, from: "bringweb3" })
            break;
        default:
            // console.log('Non exist ACTION:', action);
            break;
    }
}

export default handleIframeMessages;