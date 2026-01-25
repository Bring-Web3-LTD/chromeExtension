import getUserId from "./getUserId";
import sendMessage from "./sendMessage";
import checkNotifications from "./checkNotifications";
import getCashbackUrl from "./getCashbackUrl";
import storage from "../storage/storage";
import { isMsRangeExpired } from "./timestampRange";

interface Notification {
    token: string,
    iframeUrl: string,
    showNotification: boolean
}

const show = async (tabId: number, notification: Notification, domain: string) => {
    await sendMessage(tabId, {
        action: 'INJECT',
        page: 'notification',
        token: notification.token,
        iframeUrl: notification.iframeUrl,
        userId: await getUserId(),
        domain
    })
}

const showNotification = async (tabId: number, cashbackPagePath: string | undefined, domain: string, showNotifications: boolean, notificationCallback?: () => void): Promise<void> => {
    const notificationFromStorage = await storage.get('notification')

    const now = Date.now();

    const expiration = notificationFromStorage?.expiration

    if (isMsRangeExpired(expiration, now)) {
        await storage.remove('notification')
    } else if (notificationFromStorage) {
        return await show(tabId, notificationFromStorage, domain)
    }

    const notification = await checkNotifications(showNotifications, tabId, getCashbackUrl(cashbackPagePath))

    if (notification.showNotification) {
        if (showNotifications) {
            await show(tabId, notification, domain)
        }
        if (notificationCallback) notificationCallback()
    }
}

export default showNotification;