import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"
import { compress, searchCompressed } from "./domainsListCompression"


const checkOptOutDomain = async (domain: string, url: string): Promise<boolean> => {
    const optOutDomains = await storage.get('optOutDomains') || {}

    if (typeof optOutDomains !== 'object' || optOutDomains === null) return false

    const now = Date.now()

    let matchedKey: string | null = null
    if (optOutDomains[domain]) {
        matchedKey = domain
    } else {
        const compressed = compress(Object.keys(optOutDomains))
        const result = searchCompressed(compressed, url)
        if (result.matched) {
            matchedKey = result.match
        }
    }
    if (matchedKey) {
        if (!isMsRangeActive(optOutDomains[matchedKey] as [number, number], now)) {
            if (matchedKey !== domain) {
                delete optOutDomains[matchedKey]
                await storage.set('optOutDomains', optOutDomains)
            }
            return false
        }
        return true
    }

    return false
}

export default checkOptOutDomain
