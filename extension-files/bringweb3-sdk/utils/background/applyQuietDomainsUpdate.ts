import storage from "../storage/storage"

const applyQuietDomainsUpdate = async (quietDomains: any[]) => {
    if (!Array.isArray(quietDomains)) return
    const now = Date.now()
    const normalized = quietDomains.map((entry: any) => {
        if (!entry || typeof entry.offset !== 'number') return entry
        const { offset, ...rest } = entry
        return { ...rest, time: [now, now + offset] }
    })
    await storage.set('quietDomains', normalized)
}

export default applyQuietDomainsUpdate;
