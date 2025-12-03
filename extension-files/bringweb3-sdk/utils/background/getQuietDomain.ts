import { DAY_MS } from "../constants"
import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"

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

const getQuietDomain = async (domainPattern: string, fullUrlPath: string): Promise<Response> => {
    const quietDomains = await storage.get('quietDomains') || {}

    let phase: Phases = 'new'
    let payload: Payload = {}
    let matchedKey: string | null = null

    // Check for exact match with domain pattern first (for regular popups)
    if (quietDomains[domainPattern]) {
        const { time } = quietDomains[domainPattern]
        if (!isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })) {
            delete quietDomains[domainPattern]
            await storage.set('quietDomains', quietDomains)
        } else {
            matchedKey = domainPattern
        }
    }

    // If no exact match, check if any stored pattern matches the full URL (for OfferLine with searchTermPattern)
    if (!matchedKey) {
        for (const key in quietDomains) {
            const { time } = quietDomains[key]
            
            // Check if time range is still active
            if (!isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })) {
                delete quietDomains[key]
                await storage.set('quietDomains', quietDomains)
                continue
            }

            // Check if pattern matches the full URL path
            try {
                const regex = new RegExp(key)
                if (regex.test(fullUrlPath)) {
                    matchedKey = key
                    break
                }
            } catch (e) {
                // If key is not a valid regex, skip
                continue
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