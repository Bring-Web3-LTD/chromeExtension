import storage from "../storage/storage"
import handleActivate from "./activate"
import addOptOutDomain from "./addOptOutDomain"
import addQuietDomain from "./addQuietDomain"
import checkNotifications from "./checkNotifications"
import getCashbackUrl from "./getCashbackUrl"
import { openExtensionCashbackPage } from "./openExtensionCashbackPage"
import { getOptOut, setOptOut } from "./optOut"

const handleContentMessages = (cashbackPagePath: string | undefined, showNotifications: boolean) => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        if (request?.from !== 'bringweb3') return

        const { action } = request

        const source = request.source || 'popup'

        switch (action) {
            case 'ACTIVATE': {
                const { domain, extensionId, time, redirectUrl, iframeUrl, token, flowId } = request
                handleActivate(domain, extensionId, source, cashbackPagePath, showNotifications, time, sender.tab?.id, iframeUrl, token, flowId, redirectUrl)
                    .then(() => sendResponse());
                return true;
            }
            case 'PORTAL_ACTIVATE': {
                const { domain, extensionId, time, iframeUrl, token, flowId } = request
                handleActivate(domain, extensionId, source, cashbackPagePath, showNotifications, time, sender.tab?.id, iframeUrl, token, flowId)
                    .then(() => sendResponse());
                return true;
            }
            case 'GET_OPT_OUT': {
                getOptOut().then(res => sendResponse(res))
                return true;
            }
            case 'OPT_OUT': {
                const { time } = request
                setOptOut(time).then(res => sendResponse(res))
                return true;
            }
            case 'OPT_OUT_SPECIFIC': {
                const { domain, time } = request

                addOptOutDomain(domain, time).then(res => sendResponse(res))
                return true;
            }
            case 'GET_POPUP_ENABLED': {
                storage.get('popupEnabled').then(res => sendResponse({ isPopupEnabled: res }))
                return true;
            }
            case 'SET_POPUP_ENABLED': {
                const { isPopupEnabled } = request
                storage.set('popupEnabled', isPopupEnabled)
                    .then(() => {
                        sendResponse({ isPopupEnabled })
                    })
                    .catch(error => {
                        console.error('Error setting popup enabled:', error);
                        sendResponse({ error: 'Failed to set popup enabled state' });
                    });
                return true;
            }
            case 'CLOSE': {
                const { time, domain } = request
                if (!domain) return true;
                addQuietDomain(domain, time)
                sendResponse({ message: 'domain added to quiet list' })
                return true;
            }
            case 'WALLET_ADDRESS_UPDATE': {
                const { walletAddress } = request
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
                console.warn(`Bring unknown action: ${action}`);
                return true;
            }
        }
    })
}

export default handleContentMessages;