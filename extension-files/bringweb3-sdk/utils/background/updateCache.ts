import storage from "../storage/storage"
import fetchDomains from "../api/fetchDomains"
import safeStringify from "./safeStringify"
import { fetchWhitelist } from "../api/fetchWhitelist"
import { ApiEndpoint } from "../apiEndpoint"
import { isMsRangeExpired } from "./timestampRange"

let pending: Promise<any> | null = null;
let pendingStartTime: number | null = null;

export const updateCache = async () => {
    const [relevantDomainsCheck, relevantDomainsList, whitelistRaw] = await Promise.all([
        storage.get('relevantDomainsCheck'),
        storage.get('relevantDomains'),
        storage.get('redirectsWhitelist')
    ])
    let whitelist = whitelistRaw
    const whitelistEndpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

    let trigger: string | null = null
    const now = Date.now()

    // Check all conditions that would require a fetch
    if (!relevantDomainsList) {
        trigger = `no domains in cache`
    } else if (!Array.isArray(relevantDomainsList)) {
        trigger = `domains list isn't valid format`
    } else if (!relevantDomainsCheck) {
        trigger = `no domains timestamp check found__value: ${safeStringify(relevantDomainsCheck)}`
    } else if (!Array.isArray(relevantDomainsCheck)) {
        trigger = `invalid domains timestamp check format - not an array__value: ${safeStringify(relevantDomainsCheck)}`
    } else if (relevantDomainsCheck.length !== 2) {
        trigger = `invalid domains timestamp check format__length: ${relevantDomainsCheck.length} - value: ${safeStringify(relevantDomainsCheck)}`
    } else if (relevantDomainsCheck[0] >= now) {
        trigger = `cache expired - range start is bigger than Date.now()__value: ${safeStringify(relevantDomainsCheck)}, now: ${now}`
    } else if (now >= relevantDomainsCheck[1]) {
        trigger = `cache expired - range end is smaller than Date.now()`
    } else if (whitelistEndpoint && (!whitelist?.length || !Array.isArray(whitelist))) {
        trigger = `missing whitelist data`
    } else if (isMsRangeExpired(relevantDomainsCheck as [number, number], now)) {
        trigger = `cache expired - range is expired__range: ${safeStringify(relevantDomainsCheck)}, now: ${now}`
    }

    if (!trigger) {
        return relevantDomainsList
    }

    const MAX_PENDING_TIME = 120000; // 120 seconds

    // Check if pending is stuck
    if (pending && pendingStartTime && (now - pendingStartTime > MAX_PENDING_TIME)) {
        console.error('Pending fetch stuck, resetting');
        pending = null;
        pendingStartTime = null;
    }

    if (pending) return pending;

    pendingStartTime = now;
    return pending = (async () => {
        try {
            const res = await fetchDomains(trigger);
            const { nextUpdateTimestamp, relevantDomains, postPurchaseUrls, flags, types, quietDomainsMaxLength } = res // nextUpdateTimestamp is the delta in milliseconds until the next update

            try {
                whitelist = await fetchWhitelist()
            } catch (error) {
                console.error('Failed to fetch whitelist:', error);
            }

            const storageUpdates = [
                storage.set('relevantDomains', { regexes: relevantDomains, flags }),
                storage.set('relevantDomainsCheck', [now, now + nextUpdateTimestamp]),
                storage.set('postPurchaseUrls', postPurchaseUrls),
                storage.set('domainsTypes', types)
            ]

            if (quietDomainsMaxLength) {
                storageUpdates.push(storage.set('quietDomainsMaxLength', quietDomainsMaxLength))
            }

            if (whitelist) {
                storageUpdates.push(storage.set('redirectsWhitelist', whitelist))
            }

            await Promise.all(storageUpdates)

            return await storage.get('relevantDomains')
        } finally {
            pending = null;
            pendingStartTime = null;
        }
    })();
}