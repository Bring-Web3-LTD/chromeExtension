import storage from "../storage/storage"
import { logger } from "../logger"

// Server-driven quiet-domains sync. The backend hands back the full list when it
// has mutated it (e.g. added/removed an entry as part of activation or a followup
// fire); we replace the stored list wholesale. Numeric `time` entries are
// normalized to absolute `[now, now+time]` ranges so storage only ever holds
// ms-ranges.
const applyQuietDomainsUpdate = async (quietDomains: any[]) => {
    if (!Array.isArray(quietDomains)) {
        logger.debug(`[quiet-sync] Skipped — server sent no quiet-domains array`)
        return
    }
    const now = Date.now()
    const normalized = quietDomains.map((entry: any) => {
        if (!entry || typeof entry.offset !== 'number') return entry
        const { offset, ...rest } = entry
        return { ...rest, time: [now, now + offset] }
    })
    await storage.set('quietDomains', normalized)
    logger.info(`[quiet-sync] Quiet-domains list replaced from server`, { count: normalized.length })
}

export default applyQuietDomainsUpdate;
