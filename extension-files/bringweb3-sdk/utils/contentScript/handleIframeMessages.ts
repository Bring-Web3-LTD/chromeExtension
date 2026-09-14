import applyStyles from "./applyStyles"
import addKeyframes from "./addKeyFrames"
import { OFFERBAR_CONTAINER_ID } from "../constants"
import { contentScriptCleanup } from "./cleanupManager"
import { logger } from "../logger"

interface Props {
    event: BringEvent
    iframeEl: IFrame
    promptLogin: () => Promise<void>
    onClose?: () => void
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
    STOP_REMINDERS: 'STOP_REMINDERS',
    // Host page -> iframe only.
    FOCUS_SURFACE: 'FOCUS_SURFACE'
}

const UNION_ACTIONS = [ACTIONS.ACTIVATE]

// The surface is injected automatically, never opened by the user, so it may take focus
// only when the host page's caret isn't in an editable field - never yank a user out of a
// merchant checkout form. Only the host page can see this; the iframe is cross-origin.
const canTakeFocus = () => {
    const el = document.activeElement as HTMLElement | null
    if (!el) return true
    if (el.isContentEditable) return false
    return !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

// One focus hand-off per injected surface: OPEN is re-sent on every resize (the widget
// sends it on each expand/collapse), and re-focusing would yank focus off whatever the
// user had just tabbed to. Keyed on the element, so a re-injected surface (SPA navigation,
// self-heal, bfcache restore) is a new iframe and gets its own hand-off.
let focusedIframe: IFrame = null

// Handled entirely in the content script — these never reach the background,
const LOCAL_ACTIONS = [ACTIONS.OPEN, ACTIONS.ADD_KEYFRAMES, ACTIONS.PROMPT_LOGIN]

const handleIframeMessages = ({ event, iframeEl, promptLogin, onClose }: Props) => {
    if (!event?.data) return

    const { from, action, style, keyFrames, time, key, extensionId, url, domain, redirectUrl, iframeUrl, token, flowId, platformName, searchTermPattern, type, quietDomainType, isRegex, followups } = event.data
    if (from !== 'bringweb3') return

    // If the event comes from another extension that installed our package, ignore it (unless it ACTIVATE action)
    if (extensionId !== chrome.runtime.id && !UNION_ACTIONS.includes(action)) {
        logger.debug(`[popup-msg] Ignored — event from another extension`, { action, extensionId })
        return
    }

    // CLOSE only forwards to the background when it carries a quiet-window `time`.
    const isLocal = LOCAL_ACTIONS.includes(action) || (action === ACTIONS.CLOSE && !time)

    logger.info(`[popup-msg] ${action} event ${isLocal ? 'handled' : 'sent'}`)
    logger.debug(`[popup-msg] ${action} payload`, { domain, time, type, isRegex, flowId, platformName, searchTermPattern, url, redirectUrl, hasToken: !!token, followups: followups?.length })

    switch (action) {
        case ACTIONS.OPEN:
            const container = document.getElementById(OFFERBAR_CONTAINER_ID);
            if (container && style && 'parent' in style) {
                applyStyles(container, style.parent);
            }
            if (style && 'iframe' in style) {
                applyStyles(iframeEl, style.iframe);
            }
            // Hand focus to the surface so Escape and Tab reach it without the user having
            // to find it first. The iframe can't read the host page's activeElement, so the
            // safety call is made here and the iframe only acts on our go-ahead.
            if (focusedIframe !== iframeEl && canTakeFocus()) {
                focusedIframe = iframeEl
                iframeEl?.contentWindow?.postMessage({ from: 'bringweb3', action: ACTIONS.FOCUS_SURFACE }, '*')
                logger.debug(`[popup-msg] FOCUS_SURFACE offered to the iframe`)
            }
            break;
        case ACTIONS.CLOSE:
            // The iframe asked to close itself — the self-heal observer must be
            // disconnected before the nodes go, or it reads this as a host wipe.
            // onClose (removeElements) already runs the cleanup itself.
            if (onClose) onClose()
            else contentScriptCleanup.cleanup()
            if (time) chrome.runtime.sendMessage({ action, time, domain, type, isRegex, from: "bringweb3" })
            logger.debug(`[popup-msg] CLOSE — cleanup ran`, { forwardedToBackground: !!time, domain, time });
            break;
        case ACTIONS.PROMPT_LOGIN:
            promptLogin()
            break;
        case ACTIONS.ACTIVATE:
            chrome.runtime.sendMessage({ action, from: "bringweb3", domain, extensionId, time, redirectUrl, iframeUrl, token, flowId, platformName, quietDomainType, isRegex, followups })
            break;
        case ACTIONS.OPT_OUT:
            // domain/key aren't used by the opt-out itself — they're forwarded so the
            // background can log which retailer the user was on and which preset they picked.
            chrome.runtime.sendMessage({ action, time, domain, key, from: "bringweb3" })
            break;
        case ACTIONS.OPT_OUT_SPECIFIC:
            chrome.runtime.sendMessage({ action, domain, time, type, isRegex, key, from: "bringweb3" })
            break;
        case ACTIONS.ERASE_NOTIFICATION:
            chrome.runtime.sendMessage({ action, from: "bringweb3" })
            break;
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
            logger.warn(`[popup-msg] Unknown action: ${action}`);
            break;
    }
}

export default handleIframeMessages;