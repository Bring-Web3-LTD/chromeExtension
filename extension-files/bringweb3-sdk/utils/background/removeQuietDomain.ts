import storage from "../storage/storage"

const STORAGE_KEY = 'quietDomains'

/**
 * Remove one or more entries from the quiet-domains list.
 * Matches by `entry.domain` only (type/regex agnostic) so the backend
 * can clear a quiet entry without knowing its exact shape.
 */
const removeQuietDomain = async (domain: string | string[]): Promise<void> => {
    const targets = new Set((Array.isArray(domain) ? domain : [domain]).filter(Boolean))
    if (!targets.size) return

    const list = await storage.get(STORAGE_KEY)
    if (!Array.isArray(list) || !list.length) return

    const next = list.filter((entry: any) => !targets.has(entry?.domain))
    if (next.length !== list.length) await storage.set(STORAGE_KEY, next)
}

export default removeQuietDomain
