import storage from "../storage/storage"

const STORAGE_KEY = 'optOutDomains'

const addOptOutDomain = async (domain: string | string[], time: number) => {
    const domains = Array.isArray(domain) ? domain : [domain]
    if (domains.length === 0 || !domains[0]) return

    let optOutDomains = await storage.get(STORAGE_KEY)

    if (typeof optOutDomains !== 'object' || optOutDomains === null) {
        optOutDomains = {}
    }

    const now = Date.now()
    const end = now + time

    domains.forEach(d => {
        optOutDomains[d] = [now, end]
    })

    await storage.set(STORAGE_KEY, optOutDomains)
}

export default addOptOutDomain;