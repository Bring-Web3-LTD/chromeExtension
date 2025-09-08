import storage from "../storage/storage"

const storageKey = 'quietDomains'

interface Payload {
    iframeUrl?: string
    token?: string
    flowId?: string
}

const addQuietDomain = async (domain: string, time: number, payload?: Payload, phase?: 'activated' | 'quiet') => {
    let quietDomains = await storage.get(storageKey)

    if (typeof quietDomains !== 'object' || quietDomains === null) {
        quietDomains = {}
    }

    const now = Date.now()
    const end = now + time

    quietDomains[domain] = {
        time: [now, end],
        phase: phase || 'quiet'
    }

    if (payload) {
        quietDomains[domain].payload = payload
    }

    await storage.set(storageKey, quietDomains)
}

export default addQuietDomain;