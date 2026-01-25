import { DAY_MS } from "../constants"
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

        if (!entry.type?.includes(type)) continue
        if (searchSingle(entry.domain, url, entry.regex)) {

            const { time } = entry
            const isActive = isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })
            
            if (!isActive) {
                quietDomains.splice(i, 1)
                await storage.set('quietDomains', quietDomains)
            } else {
                phase = entry.phase || 'quiet'
                payload = entry.payload || {}
                if (phase === 'activated') {
                    entry.phase = 'quiet'
                    if (entry.payload) delete entry.payload
                    await storage.set('quietDomains', quietDomains)
                }
            }
            break
        }
    }
    
    return {
        phase,
        payload
    }

}

export default getQuietDomain;