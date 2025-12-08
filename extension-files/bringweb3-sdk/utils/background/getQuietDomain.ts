import { DAY_MS } from "../constants"
import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"
import { compress, searchCompressed } from "./domainsListCompression"

type Phases = 'new' | 'activated' | 'quiet'

interface Payload {
    iframeUrl?: string
    token?: string
    placement?: PlacementConfig  // Optional placement configuration from server
}

interface Response {
    phase: Phases
    payload: Payload
}

const getQuietDomain = async (domain: string, fullUrlPath: string): Promise<Response> => {
    const quietDomains = await storage.get('quietDomains') || {}

    let phase: Phases = 'new'
    let payload: Payload = {}
    let matchedKey: string | null = null

    // Check for exact match with domain first (for regular popups)
    if (quietDomains[domain]) {
        const { time } = quietDomains[domain]
        if (!isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })) {
            delete quietDomains[domain]
            await storage.set('quietDomains', quietDomains)
        } else {
            matchedKey = domain
        }
    }
    // If no exact match, check patterns with searchCompressed (for OfferLine with searchTermPattern)
    if (!matchedKey) {
        const compressed = compress(Object.keys(quietDomains))
        const result = searchCompressed(compressed, fullUrlPath, true, false)
        if (result.matched) {
            matchedKey = result.match
            const { time } = quietDomains[matchedKey]    
            if (!isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })) {
                delete quietDomains[matchedKey]
                await storage.set('quietDomains', quietDomains)
                matchedKey = null
            }
        }
    }
    if (matchedKey) {
        phase = quietDomains[matchedKey].phase || 'quiet'
        payload = quietDomains[matchedKey].payload || {}
        if (phase === 'activated') {
            quietDomains[matchedKey].phase = 'quiet'
            if (quietDomains[matchedKey].payload) delete quietDomains[matchedKey].payload
            await storage.set('quietDomains', quietDomains)
        }
    }
    
    return {
        phase,
        payload
    }

}

export default getQuietDomain;