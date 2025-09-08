import storage from "../storage/storage";
import addQuietDomain from "./addQuietDomain";
import checkNotifications from "./checkNotifications";
import getCashbackUrl from "./getCashbackUrl";
import isWhitelisted from "./isWhitelisted";
import { DAY_MS } from "../constants";
import closeAllPopups from "./closeAllPopups";
import { compress } from "./domainsListCompression";

const handleActivate = async (domain: string, extensionId: string, source: string, cashbackPagePath: string | undefined, showNotifications: boolean, time?: number, tabId?: number, iframeUrl?: string, token?: string, flowId?: string, redirectUrl?: string) => {
    const now = Date.now();

    const isSameExtension = extensionId === chrome.runtime.id

    if (isSameExtension) {
        const storageOps = [storage.set('lastActivation', now)];

        if (source === 'portal') storageOps.push(storage.set('portalRelevantDomains', compress([domain])))

        await Promise.all(storageOps);
    }

    const phase = isSameExtension ? 'activated' : 'quiet';


    if (domain) addQuietDomain(domain, time || DAY_MS, { iframeUrl, token, flowId }, phase);

    closeAllPopups(domain, tabId || -1, extensionId);

    if (tabId && redirectUrl) {
        if (await isWhitelisted(redirectUrl)) {
            chrome.tabs.update(tabId, { url: redirectUrl })
        }
    }

    await checkNotifications(showNotifications, undefined, getCashbackUrl(cashbackPagePath), isSameExtension)
}

export default handleActivate;