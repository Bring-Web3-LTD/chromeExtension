import { DAY_MS } from "../constants"
import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"

type Phases = 'new' | 'activated' | 'quiet'

interface Payload {
    iframeUrl?: string
    token?: string
}

interface Response {
    phase: Phases
    payload: Payload
}

const getQuietDomain = async (domain: string): Promise<Response> => {
    const quietDomains = await storage.get('quietDomains') || {}

    let phase: Phases = 'new'
    let payload: Payload = {}

    if (quietDomains[domain]) {
        const { time } = quietDomains[domain]
        if (!isMsRangeActive(time, undefined, { maxRange: 60 * DAY_MS })) {
            delete quietDomains[domain]
            await storage.set('quietDomains', quietDomains)
        } else {
            phase = quietDomains[domain].phase || 'quiet'
            payload = quietDomains[domain].payload || {}
            if (phase === 'activated') {
                quietDomains[domain].phase = 'quiet'
                if (quietDomains[domain].payload) delete quietDomains[domain].payload
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