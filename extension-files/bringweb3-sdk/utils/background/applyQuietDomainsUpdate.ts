import storage from "../storage/storage"

// Server-driven quiet-domains sync. The backend hands back the full list when it
// has mutated it (e.g. added/removed an entry as part of activation or a followup
// fire); we replace the stored list wholesale. Numeric `time` entries are
// normalized to absolute `[now, now+time]` ranges so storage only ever holds
// ms-ranges.
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
