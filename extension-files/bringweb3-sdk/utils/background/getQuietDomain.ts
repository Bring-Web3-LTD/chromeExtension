import { DAY_MS } from "../constants"
import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"
import { searchArray } from "./domainsListCompression"

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

const getQuietDomain = async (url: string): Promise<Response> => {
    const quietDomains = await storage.get('quietDomains') || []

    let phase: Phases = 'new'
    let payload: Payload = {}
    let matchedKey: string | null = null

    const keys = quietDomains.map((d: any) => d.domain)
    const result = searchArray(keys, url)
    if (result.matched) {
        matchedKey = result.match
    }
    if (matchedKey) {
        const entry = quietDomains.find((d: any) => d.domain === matchedKey)
        const { time } = entry
        const isActive = isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })        
        if (!isActive) {
            const filtered = quietDomains.filter((d: any) => d.domain !== matchedKey)
            await storage.set('quietDomains', filtered)
        } else {
            phase = entry.phase || 'quiet'
            payload = entry.payload || {}
            if (phase === 'activated') {
                entry.phase = 'quiet'
                if (entry.payload) delete entry.payload
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