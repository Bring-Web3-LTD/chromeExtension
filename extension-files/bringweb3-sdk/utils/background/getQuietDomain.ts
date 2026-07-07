import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"
import { searchSingle } from "./domainsListSearch"

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

const getQuietDomain = async (url: string, type?: string): Promise<Response> => {
    const quietDomains = await storage.get('quietDomains') || []

    let phase: Phases = 'new'
    let payload: Payload = {}

    for (let i = 0; i < quietDomains.length; i++) {
        const entry = quietDomains[i]

        if (type && !type.split('').some(t => entry.type?.includes(t))) continue

        if (searchSingle(entry.domain, url, entry.regex)) {
            // Expired entries are only pruned in addQuietDomain; skip them here so a
            // stale record doesn't shadow a valid one behind it.
            if (!isMsRangeActive(entry.time)) continue
            phase = entry.phase || 'quiet'
            payload = entry.payload || {}
            break
        }
    }
    
    return {
        phase,
        payload
    }

}

export default getQuietDomain;