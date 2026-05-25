import storage from "../storage/storage"
import validateDomain from "../api/validateDomain"

// Server-defined navigation watchers persisted across SW restarts. See WORKFLOW.md.

// Mirror of backend's FollowupId in backend/utils/retailers/types.ts.
// Fires are always reposted to /check/popup; the backend dispatches by id.
export enum FollowupId {
    /** Thank-you page tracking — fires once after the user activated. */
    TnxAnalytics = 'TnxAnalytics',
}

const KNOWN_IDS = new Set<string>(Object.values(FollowupId))

type FollowupType = 'TOF' | 'FOT'
type FollowupScope = 'tab' | 'browser'

interface FollowupCtl {
    type: FollowupType
    scope: FollowupScope
    regex: string
    cnt: number
}

interface IncomingFollowup {
    id: FollowupId
    ctl: FollowupCtl
    ttl: number     // duration in ms
    trigger: string // regex
    meta?: string  // opaque server context, echoed back on fire
}

interface FollowupRecord extends IncomingFollowup {
    expiresAt: number
    tabId: number | null  // null = browser-scope
    fotMatches: string[]
}

const STORAGE_KEY = 'followups'

// Mutations are serialized to avoid read-modify-write races on concurrent navigations.
let queue: Promise<any> = Promise.resolve()
const serialize = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(fn, fn)
    queue = next.catch(() => { })
    return next
}

const read = async (): Promise<FollowupRecord[]> => {
    const raw = await storage.get(STORAGE_KEY)
    return Array.isArray(raw) ? raw : []
}

const write = (records: FollowupRecord[]) => storage.set(STORAGE_KEY, records)

const test = (pattern: string, url: string): boolean => {
    try {
        return new RegExp(pattern).test(url)
    } catch {
        return false
    }
}

const isValid = (f: any): f is IncomingFollowup =>
    f && typeof f.id === 'string' && KNOWN_IDS.has(f.id)
    && typeof f.trigger === 'string'
    && typeof f.ttl === 'number' && f.ttl > 0
    && f.ctl && (f.ctl.type === 'TOF' || f.ctl.type === 'FOT')
    && (f.ctl.scope === 'tab' || f.ctl.scope === 'browser')
    && typeof f.ctl.regex === 'string'
    && typeof f.ctl.cnt === 'number' && f.ctl.cnt > 0

export const armFollowups = async (incoming: any, originatingTabId?: number) => {
    if (!Array.isArray(incoming)) return

    const now = Date.now()
    const newRecords: FollowupRecord[] = []
    for (const f of incoming) {
        if (!isValid(f)) continue
        if (f.ctl.scope === 'tab' && (originatingTabId === undefined || originatingTabId < 0)) continue
        newRecords.push({
            id: f.id,
            ctl: { ...f.ctl },
            ttl: f.ttl,
            trigger: f.trigger,
            meta: f.meta,
            expiresAt: now + f.ttl,
            tabId: f.ctl.scope === 'tab' ? originatingTabId! : null,
            fotMatches: [],
        })
    }
    if (!newRecords.length) return

    await serialize(async () => {
        await write([...await read(), ...newRecords])
    })
}

export const processNavigation = async (tabId: number, url: string): Promise<any | null> => {
    if (!url) return null
    console.log('[followups] processNavigation', tabId, url)
    const stored = await read()
    console.log('[followups] stored records:', JSON.stringify(stored))

    const fired: Array<FollowupRecord & { matches: string[] }> = []

    await serialize(async () => {
        const now = Date.now()
        const records = await read()
        if (!records.length) return

        const dropped = new Set<FollowupRecord>()

        for (const rec of records) {
            if (rec.tabId !== null && rec.tabId !== tabId) continue

            // Every in-scope navigation costs one cnt budget (for TOF and FOT alike).
            // Trigger is checked first so a match on the boundary navigation still fires.
            const inScope = test(rec.ctl.regex, url)
            const triggered = test(rec.trigger, url)

            if (triggered) {
                if (rec.ctl.type === 'TOF') {
                    fired.push({ ...rec, matches: [url] })
                    dropped.add(rec)
                    continue
                } else {
                    rec.fotMatches.push(url)
                }
            }

            if (inScope) rec.ctl.cnt -= 1
        }

        for (const rec of records) {
            if (dropped.has(rec)) continue
            if (rec.ctl.cnt <= 0) {
                if (rec.ctl.type === 'FOT') fired.push({ ...rec, matches: rec.fotMatches.slice() })
                dropped.add(rec)
            } else if (rec.expiresAt <= now) {
                dropped.add(rec)
            }
        }

        await write(records.filter(r => !dropped.has(r)))
    })

    if (!fired.length) return null

    // All fires repost to /check/popup — the backend dispatches by id
    // (emits analytics for TnxAnalytics, returns a popup payload for others, …).
    try {
        const wire = fired.map(({ tabId: _t, fotMatches: _f, expiresAt: _e, ...rest }) => rest)
        const response = await validateDomain({
            body: {
                phase: 'new',
                url,
                address: await storage.get('walletAddress'),
                quietDomains: [],
                followups: wire,
            }
        })
        if (response?.followups) await armFollowups(response.followups, tabId)
        return response?.isValid ? response : null
    } catch {
        return null
    }
}

export const cleanupTabFollowups = async (tabId: number) => {
    await serialize(async () => {
        const records = await read()
        const remaining = records.filter(r => r.tabId !== tabId)
        if (remaining.length !== records.length) await write(remaining)
    })
}
