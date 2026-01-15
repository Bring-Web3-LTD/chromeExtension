import { DAY_MS } from "../constants"
import { isMsRangeActive } from "./timestampRange"

interface QuietDomainEntry {
    domain: string
    time: [number, number]
    phase: 'activated' | 'quiet'
    type?: string
    payload?: {
        iframeUrl?: string
        token?: string
        flowId?: string
        placement?: PlacementConfig
    }
}

export const cleanupQuietDomains = (quietDomains: any, maxLength: number = 50) => {
    const now = Date.now()
    
    const validEntries = quietDomains.filter((entry: QuietDomainEntry) => {
        return isMsRangeActive(entry.time, now, { maxRange: 60 * DAY_MS })
    })
    
    if (validEntries.length > maxLength) {
        return validEntries
            .sort((a: QuietDomainEntry, b: QuietDomainEntry) => b.time[0] - a.time[0])
            .slice(0, maxLength)
    }
    
    return validEntries
}