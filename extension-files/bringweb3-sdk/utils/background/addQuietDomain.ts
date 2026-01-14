import storage from "../storage/storage"
import { cleanupQuietDomains } from "./cleanupDomains"

const storageKey = 'quietDomains'

interface Payload {
    iframeUrl?: string
    token?: string
    flowId?: string
    placement?: PlacementConfig  // Optional placement configuration from server
}

const addQuietDomain = async (domain: string | string[], time: number, payload?: Payload, phase?: 'activated' | 'quiet') => {
    if(!domain) return
    const domains = Array.isArray(domain) ? domain : [domain]
    
    let [quietDomains, maxLength] = await Promise.all([
        storage.get(storageKey),
        storage.get('quietDomainsMaxLength')
    ])

    if (!Array.isArray(quietDomains)) {
        quietDomains = []
    }
    quietDomains = cleanupQuietDomains(quietDomains, maxLength)

    const now = Date.now()
    const end = now + time

    for (const singleDomain of domains) {
        if (!singleDomain) continue

        const entry: any = {
            domain: singleDomain,
            time: [now, end],
            phase: phase || 'quiet'
        }

        if (payload) {
            entry.payload = payload
        }
        const existingIndex = quietDomains.findIndex((d: any) => d.domain === singleDomain)
        if (existingIndex >= 0) {
            quietDomains[existingIndex] = entry
        } else {
            quietDomains.push(entry)
        }
    }

    await storage.set(storageKey, quietDomains)
}

export default addQuietDomain;