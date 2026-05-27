import storage from "../storage/storage"
import validateDomain from "../api/validateDomain"
import parseUrl from "../parseUrl"
import { searchRegexArray } from "./domainsListSearch"

// Server-defined navigation watchers persisted across SW restarts. See WORKFLOW.md.

// 't' = Trigger-On-Find (fire+drop), 'f' = Fire-On-Threshold (fire when cnt<=0)
type FollowupType = 't' | 'f'
type FollowupScope = 'tab' | 'browser'

interface FollowupCtl {
    type: FollowupType
    scope: FollowupScope
    regex: string
    cnt: number
}

interface IncomingFollowup {
    id: string
    ctl: FollowupCtl
    ttl: number     // duration in ms
    trigger: string // regex (reverse-host compressed)
    meta?: string  // opaque server context, echoed back on fire
}

interface MatchEntry {
    match: string[]
    type: FollowupType
}

interface FollowupRecord extends IncomingFollowup {
    expiresAt: number
    tabId: number | null  // null = browser-scope
    fotMatches: MatchEntry[]
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

/** Match a followup trigger via `searchRegexArray`; tag the result with the followup's own type. */
const matchTrigger = async (pattern: string, url: string, type: FollowupType): Promise<MatchEntry | null> => {
    try {
        const res = await searchRegexArray([new RegExp(pattern)], parseUrl(url))
        return res.matched ? { match: res.match, type } : null
    } catch {
        return null
    }
}

const isValid = (f: any): f is IncomingFollowup =>
    f && typeof f.id === 'string' && f.id.length > 0
    && typeof f.trigger === 'string'
    && typeof f.ttl === 'number' && f.ttl > 0
    && f.ctl && (f.ctl.type === 't' || f.ctl.type === 'f')
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

    // Dedupe by (id, meta, tabId): re-arming replaces, not duplicates.
    // Browser-scope tabId is null → one record per (id, meta) globally.
    const keyOf = (r: FollowupRecord) => `${r.id}|${r.meta ?? ''}|${r.tabId ?? ''}`
    const incomingKeys = new Set(newRecords.map(keyOf))

    await serialize(async () => {
        const kept = (await read()).filter(r => !incomingKeys.has(keyOf(r)))
        await write([...kept, ...newRecords])
    })
}

export const processNavigation = async (tabId: number, url: string): Promise<any | null> => {
    if (!url) return null

    const fired: Array<FollowupRecord & { matches: MatchEntry[] }> = []

    await serialize(async () => {
        const now = Date.now()
        const records = await read()
        if (!records.length) return

        const dropped = new Set<FollowupRecord>()

        for (const rec of records) {
            if (rec.tabId !== null && rec.tabId !== tabId) continue

            // Every in-scope navigation costs one cnt budget (for 't' and 'f' alike).
            // Trigger is checked first so a match on the boundary navigation still fires.
            const scopeMatch = await matchTrigger(rec.ctl.regex, url, rec.ctl.type)
            const triggerMatch = await matchTrigger(rec.trigger, url, rec.ctl.type)

            if (triggerMatch) {
                if (rec.ctl.type === 't') {
                    fired.push({ ...rec, matches: [triggerMatch] })
                    dropped.add(rec)
                    continue
                } else {
                    rec.fotMatches.push(triggerMatch)
                }
            }

            if (scopeMatch) rec.ctl.cnt -= 1
        }

        for (const rec of records) {
            if (dropped.has(rec)) continue
            if (rec.ctl.cnt <= 0) {
                if (rec.ctl.type === 'f') fired.push({ ...rec, matches: rec.fotMatches.slice() })
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
        const quietDomains = (await storage.get('quietDomains')) || []
        const response = await validateDomain({
            body: {
                phase: 'new',
                url,
                address: await storage.get('walletAddress'),
                quietDomains,
                followups: wire,
            }
        })
        // Return the full response — the caller (handleTabEvents.handlePopupResponse) decides
        // what to do based on isValid / verifiedMatch / followups (mirrors validateAndInject).
        return response ?? null
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
