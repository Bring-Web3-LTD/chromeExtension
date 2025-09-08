import storage from "../storage/storage";
import checkEvents from "../api/checkEvents";
import getWalletAddress from "./getWalletAddress";
import { isMsRangeActive } from "./timestampRange";

const checkNotifications = async (showNotifications: boolean, tabId?: number, cashbackUrl?: string, checkAnyway: boolean = false) => {
    const falseReturn = { showNotification: false, token: '', iframeUrl: '' };

    const now = Date.now();

    const nextCall = await storage.get('notificationCheck');

    if (!checkAnyway && isMsRangeActive(nextCall, now)) return falseReturn;

    const walletAddress = tabId ? await getWalletAddress(tabId) : await storage.get('walletAddress')

    const lastActivation = await storage.get('lastActivation')
    const timeSinceLastActivation = lastActivation ? now - lastActivation : undefined;

    const res = await checkEvents({ walletAddress, cashbackUrl, lastActivation, timeSinceLastActivation });

    await storage.set('notificationCheck', [now, now + res.nextCall]);

    const notification = {
        showNotification: res.showNotification as boolean,
        token: res.token as string,
        iframeUrl: res.iframeUrl as string,
        expiration: [now, now + res.expiration]
    }

    if (notification.showNotification && showNotifications) {
        await Promise.all([
            storage.set('notification', notification),
            storage.remove('lastActivation')
        ])
    }

    return notification
}

export default checkNotifications;