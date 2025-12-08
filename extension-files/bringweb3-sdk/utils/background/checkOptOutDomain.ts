import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"
import { compress, searchCompressed } from "./domainsListCompression"


const checkOptOutDomain = async (domain: string, url: string): Promise<boolean> => {
    const optOutDomains = await storage.get('optOutDomains') || {}

    if (typeof optOutDomains !== 'object' || optOutDomains === null) return false

    const now = Date.now()

    // Check exact match with domain first
    if (optOutDomains[domain] && isMsRangeActive(optOutDomains[domain] as [number, number], now)) {
        return true
    }

    const compressed = compress(Object.keys(optOutDomains))
    const result = searchCompressed(compressed, url, true, false)

    if (result.matched) {

        if (!isMsRangeActive(optOutDomains[result.match] as [number, number], now)) {
            delete optOutDomains[result.match]
            await storage.set('optOutDomains', optOutDomains)
            return false
        }

        return true
    }

    return false
}

export default checkOptOutDomain
