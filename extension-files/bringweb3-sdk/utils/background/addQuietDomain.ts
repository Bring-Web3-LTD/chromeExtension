import storage from "../storage/storage"
import { cleanupQuietDomains } from "./cleanupDomains"

const storageKey = 'quietDomains'

interface Payload {
    iframeUrl?: string
    token?: string
    flowId?: string
    placement?: PlacementConfig  // Optional placement configuration from server
}

const addQuietDomain = async (domain: string, time: number, payload?: Payload, phase?: 'activated' | 'quiet') => {
    if (!domain) return
    let quietDomains = await storage.get(storageKey)

    if (!Array.isArray(quietDomains)) {
        quietDomains = []
    }
    const maxLength = await storage.get('quietDomainsMaxLength')
    quietDomains = cleanupQuietDomains(quietDomains, maxLength)

    const now = Date.now()
    const end = now + time

    const entry: any = {
        domain,
        time: [now, end],
        phase: phase || 'quiet'
    }

    if (payload) {
        entry.payload = payload
    }
    const existingIndex = quietDomains.findIndex((d: any) => d.domain === domain)
    if (existingIndex >= 0) {
        quietDomains[existingIndex] = entry
    } else {
        quietDomains.push(entry)
    }

    await storage.set(storageKey, quietDomains)
}

export default addQuietDomain;