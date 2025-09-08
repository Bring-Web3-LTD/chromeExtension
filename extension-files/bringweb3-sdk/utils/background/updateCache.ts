import storage from "../storage/storage"
import fetchDomains from "../api/fetchDomains"
import safeStringify from "./safeStringify"
import { fetchWhitelist } from "../api/fetchWhitelist"
import { ApiEndpoint } from "../apiEndpoint"
import { isMsRangeExpired } from "./timestampRange"

export const updateCache = async () => {
    const relevantDomainsCheck = await storage.get('relevantDomainsCheck') // This is an array with two elements: [cacheStart, cacheEnd]
    const relevantDomainsList = await storage.get('relevantDomains')
    let whitelist = await storage.get('redirectsWhitelist')
    const whitelistEndpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

    let trigger: string | null = null
    const now = Date.now()

    // Check all conditions that would require a fetch
    if (!relevantDomainsList) {
        trigger = `no domains in cache`
    } else if (!(relevantDomainsList instanceof Uint8Array)) {
        trigger = `domains list isn't an Uint8Array`
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
    } else if (whitelistEndpoint && (!whitelist?.length || !(whitelist instanceof Uint8Array))) {
        trigger = `missing whitelist data`
    } else if (isMsRangeExpired(relevantDomainsCheck as [number, number], now)) {
        trigger = `cache expired - range is expired__range: ${safeStringify(relevantDomainsCheck)}, now: ${now}`
    }

    if (!trigger) {
        return relevantDomainsList
    }

    const res = await fetchDomains(trigger)
    const { nextUpdateTimestamp, relevantDomains, postPurchaseUrls } = res // nextUpdateTimestamp is the delta in milliseconds until the next update

    whitelist = await fetchWhitelist()

    const storageUpdates = [
        storage.set('relevantDomains', relevantDomains),
        storage.set('relevantDomainsCheck', [now, now + nextUpdateTimestamp]),
        storage.set('postPurchaseUrls', postPurchaseUrls)
    ]

    if (whitelist) {
        storageUpdates.push(storage.set('redirectsWhitelist', whitelist))
    }

    await Promise.all(storageUpdates)

    return relevantDomains
}