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

    if (quietDomains[domain]) {
        matchedKey = domain
    } else {
        const compressed = compress(Object.keys(quietDomains))
        const result = searchCompressed(compressed, fullUrlPath)
        if (result.matched) {
            matchedKey = result.match
        }
    }
    if (matchedKey) {
        const { time } = quietDomains[matchedKey]
        const isActive = isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })        
        if (!isActive) {
            delete quietDomains[matchedKey]
            await storage.set('quietDomains', quietDomains)
        } else {
            phase = quietDomains[matchedKey].phase || 'quiet'
            payload = quietDomains[matchedKey].payload || {}
            if (phase === 'activated') {
                quietDomains[matchedKey].phase = 'quiet'
                if (quietDomains[matchedKey].payload) delete quietDomains[matchedKey].payload
                await storage.set('quietDomains', quietDomains)
            }
        }
    }
    
    return {
        phase,
        payload
    }

}

export default getQuietDomain;