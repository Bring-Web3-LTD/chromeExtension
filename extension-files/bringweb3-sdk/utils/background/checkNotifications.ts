import storage from "../storage/storage";
import checkEvents from "../api/checkEvents";
import getWalletAddress from "./getWalletAddress";
import { isMsRangeActive } from "./timestampRange";
import { logger } from "../logger";

const ERROR_BACKOFF_MS = 60 * 60 * 1000;

const checkNotifications = async (showNotifications: boolean, tabId?: number, cashbackUrl?: string, checkAnyway: boolean = false) => {
    const falseReturn = { showNotification: false, token: '', iframeUrl: '' };

    const now = Date.now();

    const nextCall = await storage.get('notificationCheck');

    if (!checkAnyway && isMsRangeActive(nextCall, now)) return falseReturn;

    const walletAddress = tabId ? await getWalletAddress(tabId) : await storage.get('walletAddress')

    const lastActivation = await storage.get('lastActivation')
    const timeSinceLastActivation = lastActivation ? now - lastActivation : undefined;

    let res;
    try {
        res = await checkEvents({ walletAddress, cashbackUrl, lastActivation, timeSinceLastActivation });
    } catch (error) {
        // Network failure or a non-JSON reply (e.g. a WAF block page): store the
        // backoff here too, or the next trigger retries immediately.
        logger.warn('notification check failed, backing off', { error });
        await Promise.all([
            storage.set('notificationCheck', [now, now + ERROR_BACKOFF_MS]),
            storage.set('lastCheckedWalletAddress', walletAddress ?? ''),
        ]);
        return falseReturn;
    }

    await Promise.all([
        // An error body has no nextCall; without a fallback the stored range is [now, NaN],
        // which reads as expired and retries on every navigation.
        storage.set('notificationCheck', [now, now + (res.nextCall ?? ERROR_BACKOFF_MS)]),
        // Dedup marker for WALLET_ADDRESS_UPDATE: the address this check actually used.
        // Not `walletAddress` - getWalletAddress writes that on navigation, so an account
        // switch would look unchanged by the time the wallet's broadcast arrives.
        storage.set('lastCheckedWalletAddress', walletAddress ?? ''),
    ]);

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