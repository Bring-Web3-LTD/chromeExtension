import storage from "../storage";
import checkEvents from "../api/checkEvents";
import getWalletAddress from "./getWalletAddress";
import { isMsRangeActive } from "./timestampRange";

const checkNotifications = async (tabId?: number, cashbackUrl?: string) => {
    const falseReturn = { showNotification: false, token: '', iframeUrl: '' };

    const now = Date.now();

    const nextCall = await storage.get('notificationCheck');

    if (isMsRangeActive(nextCall, now)) return falseReturn;

    const walletAddress = tabId ? await getWalletAddress(tabId) : await storage.get('walletAddress')

    if (!walletAddress) return falseReturn;

    const lastActivation = await storage.get('lastActivation')
    const timeSinceLastActivation = lastActivation ? now - lastActivation : undefined;

    const res = await checkEvents({ walletAddress, cashbackUrl, lastActivation, timeSinceLastActivation });

    storage.set('notificationCheck', [now, now + res.nextCall]);

    const notification = {
        showNotification: res.showNotification as boolean,
        token: res.token as string,
        iframeUrl: res.iframeUrl as string,
        expiration: [now, now + res.expiration]
    }

    if (notification.showNotification) {
        await storage.set('notification', notification)
    }

    return notification
}

export default checkNotifications;