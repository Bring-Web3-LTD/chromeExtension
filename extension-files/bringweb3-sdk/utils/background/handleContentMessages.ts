import storage from "../storage/storage"
import handleActivate from "./activate"
import addQuietDomain from "./addQuietDomain"
import checkNotifications from "./checkNotifications"
import getCashbackUrl from "./getCashbackUrl"
import { openExtensionCashbackPage } from "./openExtensionCashbackPage"
import { getOptOut, setOptOut } from "./optOut"
import { armFollowups } from "./followups"
import { logger } from "../logger"
import { DAY_MS } from "../constants"

// '24Hours' | '30Days' | 'forever' when the popup sent its preset label; the day count
// covers the keyless callers (e.g. setTurnOff, whose 'forever' is MAX_SAFE_INTEGER).
const describeWindow = (time: number, key?: string): string =>
    `${key || `${Math.round(time / DAY_MS)} day(s)`} (until ${new Date(Date.now() + time).toISOString()})`

const handleContentMessages = (cashbackPagePath: string | undefined, showNotifications: boolean) => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        if (request?.from !== 'bringweb3') return

        // token is pulled out so it never reaches the log; the rest is spread so a new
        // message field shows up without touching this line.
        const { action, token, ...rest } = request

        const source = request.source || 'popup'

        logger.info(`[bg-msg] ${action} event received`)
        logger.debug(`[bg-msg] ${action} payload`, { ...rest, source, tabId: sender.tab?.id, hasToken: !!token })

        // Generic followup trigger — followups can ride along with any interaction
        // point (activate | popup close | optout), so arm them at the listener level
        // rather than tying the trigger to a single action handler.
        if (Array.isArray(request.followups) && request.followups.length) {
            armFollowups(request.followups, sender.tab?.id).catch(() => { })
        }

        switch (action) {
            case 'ACTIVATE': {
                const { domain, extensionId, time, redirectUrl, iframeUrl, token, flowId, quietDomainType, isRegex } = request
                handleActivate(domain, extensionId, source, cashbackPagePath, showNotifications, quietDomainType, isRegex, time, sender.tab?.id, iframeUrl, token, flowId, redirectUrl)
                    .then(() => sendResponse());
                return true;
            }
            case 'PORTAL_ACTIVATE': {
                const { domain, extensionId, time, iframeUrl, token, flowId, type, isRegex } = request
                handleActivate(domain, extensionId, source, cashbackPagePath, showNotifications,type, isRegex, time, sender.tab?.id, iframeUrl, token, flowId)
                    .then(() => sendResponse());
                return true;
            }
            case 'GET_OPT_OUT': {
                getOptOut().then(res => sendResponse(res))
                return true;
            }
            case 'OPT_OUT': {
                const { time, domain, key } = request
                if (time < 0) {
                    logger.info(`[optout] User turned popups back on for all websites`)
                } else {
                    logger.info(`[optout] User opted out of ALL websites for ${describeWindow(time, key)}${domain ? ` — chose it on ${domain}` : ''}`)
                }
                setOptOut(time).then(res => sendResponse(res))
                return true;
            }
            case 'OPT_OUT_SPECIFIC': {
                const { domain, time, type, isRegex, key } = request
                if (!domain?.length) {
                    logger.warn(`[bg-msg] OPT_OUT_SPECIFIC ignored — missing domain`)
                    sendResponse({ error: 'Missing domain' })
                    return true
                }
                logger.info(`[optout] User opted out of ${domain} for ${describeWindow(time, key)}`)
                addQuietDomain(domain, time, type, isRegex).then(res => sendResponse(res))
                return true;
            }
            case 'GET_POPUP_ENABLED': {
                storage.get('popupEnabled').then(res => {
                    logger.debug(`[bg-msg] GET_POPUP_ENABLED — resolved`, { isPopupEnabled: res })
                    sendResponse({ isPopupEnabled: res })
                })
                return true;
            }
            case 'SET_POPUP_ENABLED': {
                const { isPopupEnabled } = request
                storage.set('popupEnabled', isPopupEnabled)
                    .then(() => {
                        logger.debug(`[bg-msg] SET_POPUP_ENABLED — stored`, { isPopupEnabled })
                        sendResponse({ isPopupEnabled })
                    })
                    .catch(error => {
                        logger.error('failed to set popup enabled', { error });
                        sendResponse({ error: 'Failed to set popup enabled state' });
                    });
                return true;
            }
            case 'CLOSE': {
                const { time, domain, type, isRegex } = request
                if (!domain) {
                    logger.warn(`[bg-msg] CLOSE ignored — no domain in request`)
                    return true;
                }
                addQuietDomain(domain, time, type, isRegex)
                sendResponse({ message: 'domain added to quiet list' })
                return true;
            }
            case 'WALLET_ADDRESS_UPDATE': {
                const { walletAddress } = request
                logger.debug(`[bg-msg] WALLET_ADDRESS_UPDATE — ${walletAddress ? 'storing' : 'removing'} wallet address`)
                if (!walletAddress) {
                    storage.remove('walletAddress')
                        .then(() => sendResponse({ message: 'wallet address removed successfully' }))
                } else {
                    storage.set('walletAddress', walletAddress as string)
                        .then(() =>
                            checkNotifications(showNotifications, undefined, getCashbackUrl(cashbackPagePath), true)
                                .then(() => sendResponse(walletAddress))
                        )
                }
                return true;
            }
            case 'ERASE_NOTIFICATION':
                storage.remove('notification')
                    .then(() => sendResponse({ message: 'notification erased successfully' }))
                return true
            case 'OPEN_CASHBACK_PAGE':
                const { url } = request
                openExtensionCashbackPage(url || cashbackPagePath)
                sendResponse({ message: 'cashback page opened successfully' })
                return true
            case 'STOP_REMINDERS':
                storage.set('disableReminders', true)
                    .then(() => sendResponse({ message: 'stopped reminders successfully' }))
                return true
            default: {
                logger.warn(`[bg-msg] Unknown action: ${action}`);
                return true;
            }
        }
    })
}

export default handleContentMessages;