import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"

/**
 * Check if a domain is in the opted-out domains list
 * Supports both exact matches and regex patterns
 * 
 * @param query - The domain/URL to check (e.g., "google.com/search?q=shoes")
 * @returns true if the domain is opted out and the opt-out period is still active, false otherwise
 */
const checkOptOutDomain = async (query: string): Promise<boolean> => {
    const optOutDomains = await storage.get('optOutDomains') || {}
    
    if (typeof optOutDomains !== 'object' || optOutDomains === null) {
        return false
    }
    
    const now = Date.now()
    
    // Check each stored domain pattern
    for (const [domainPattern, timeRange] of Object.entries(optOutDomains)) {
        // Check if time range is still active
        if (!isMsRangeActive(timeRange as [number, number], now)) {
            // Clean up expired entry
            delete optOutDomains[domainPattern]
            await storage.set('optOutDomains', optOutDomains)
            continue
        }
        
        // Check if pattern matches the query
        try {
            // Try as regex first
            const regex = new RegExp(domainPattern)
            if (regex.test(query)) {
                return true
            }
        } catch (e) {
            // If not valid regex, try exact match
            if (domainPattern === query) {
                return true
            }
        }
    }
    
    return false
}

export default checkOptOutDomain
