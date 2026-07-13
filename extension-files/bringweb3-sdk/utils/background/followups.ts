import storage from "../storage/storage"
import validateDomain from "../api/validateDomain"
import applyQuietDomainsUpdate from "./applyQuietDomainsUpdate"
import parseUrl from "../parseUrl"
import { searchRegexArray } from "./domainsListSearch"
import { logger } from "../logger"

// Server-defined navigation watchers persisted across SW restarts. See WORKFLOW.md.

// 't' = TOF → Terminate On Fire, 'f' = FOT → Fire On Terminate
type FollowupType = 't' | 'f'

// Wire shape lives in the ambient `Followup` interface (types.d.ts); FollowupType
// here just names its ctl.type union for MatchEntry/matchTrigger reuse.

interface MatchEntry {
    match: string[]
    type: FollowupType
}

interface FollowupRecord extends Followup {
    expiresAt: number
    tabId: number | null  // null = browser-scope
    matches: MatchEntry[]
    // Compiled once by the `followups` storage helper (see storage/helpers.ts).
    // Present on records read from storage; absent on freshly-armed records until
    // the next read. The raw `trigger`/`ctl.regex` strings stay the source of truth.
    triggerRegex?: RegExp
    ctlRegex?: RegExp
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

// Strip the cached compiled RegExp before persisting — chrome.storage holds only
// the raw string form; the `followups` storage helper recompiles into cache.
const serializeRecord = ({ triggerRegex, ctlRegex, ...rest }: FollowupRecord) => rest
const write = (records: FollowupRecord[]) => storage.set(STORAGE_KEY, records.map(serializeRecord))

/** Match a precompiled followup regex via `searchRegexArray`; tag the result with the followup's own type. */
const matchTrigger = async (regex: RegExp, url: string, type: FollowupType): Promise<MatchEntry | null> => {
    try {
        const res = await searchRegexArray([regex], parseUrl(url))
        return res.matched ? { match: res.match, type } : null
    } catch {
        return null
    }
}

const canCompile = (pattern: string): boolean => {
    try { new RegExp(pattern); return true } catch { return false }
}

const isValid = (f: any): f is Followup =>
    f && typeof f.id === 'string' && f.id.length > 0
    && typeof f.trigger === 'string' && canCompile(f.trigger)
    && typeof f.ttl === 'number' && f.ttl > 0
    && f.ctl && (f.ctl.type === 't' || f.ctl.type === 'f')
    && (f.ctl.scope === 'tab' || f.ctl.scope === 'browser')
    && typeof f.ctl.regex === 'string' && canCompile(f.ctl.regex)
    && typeof f.ctl.cnt === 'number' && f.ctl.cnt > 0

export const armFollowups = async (incoming: any, originatingTabId?: number) => {
    if (!Array.isArray(incoming)) return

    const now = Date.now()
    const newRecords: FollowupRecord[] = []
    for (const f of incoming) {
        if (!isValid(f)) continue
        if (f.ctl.scope === 'tab' && (originatingTabId === undefined || originatingTabId < 0)) continue
        // Deep-clone the wire record so any future server fields carry over
        // automatically; only stamp the locally-derived bookkeeping fields.
        newRecords.push({
            ...structuredClone(f),
            expiresAt: now + f.ttl,
            tabId: f.ctl.scope === 'tab' ? originatingTabId! : null,
            matches: [],
        })
    }
    if (!newRecords.length) return

    // Append — re-arming adds records, it does not replace. Multiple records of the
    // same (id, tabId) are allowed to coexist.
    await serialize(async () => {
        const existing = await read()
        await write(existing.concat(newRecords))
    })

    logger.debug(`[followup] Armed navigation watchers`, { tabId: originatingTabId, count: newRecords.length, ids: newRecords.map(r => r.id) })
}

export const processNavigation = async (tabId: number, url: string): Promise<any | null> => {
    if (!url) return null

    // One `matches` array per record — disambiguate by `ctl.type` ('t' = single
    // trigger match; 'f' = accumulated matches) and by `matches.length`.
    const fired: FollowupRecord[] = []

    await serialize(async () => {
        const now = Date.now()
        const records = await read()
        if (!records.length) return

        logger.debug(`[followup] Evaluating navigation against watchers`, { tabId, url, records: records.length })

        const dropped = new Set<FollowupRecord>()

        for (const rec of records) {
            if (rec.tabId !== null && rec.tabId !== tabId) continue
            if (!rec.triggerRegex || !rec.ctlRegex) {
                logger.debug(`[followup] Dropping watcher — missing compiled regex`, { tabId, id: rec.id })
                dropped.add(rec); continue
            }

            // Scope gates everything: an out-of-scope navigation can't fire or spend
            // budget, so skip the trigger check entirely. An in-scope navigation costs
            // one cnt budget (for 't' and 'f' alike), charged immediately.
            const scopeMatch = await matchTrigger(rec.ctlRegex, url, rec.ctl.type)
            if (!scopeMatch) continue
            rec.ctl.cnt -= 1
            logger.debug(`[followup] Watcher in scope — spent 1 budget`, { tabId, id: rec.id, type: rec.ctl.type, cntLeft: rec.ctl.cnt })

            const triggerMatch = await matchTrigger(rec.triggerRegex, url, rec.ctl.type)
            if (triggerMatch) {
                if (rec.ctl.type === 't') {
                    logger.debug(`[followup] Trigger matched (TOF) — firing and dropping watcher`, { tabId, id: rec.id })
                    fired.push({ ...rec, matches: [triggerMatch] })
                    dropped.add(rec)
                    continue
                } else {
                    logger.debug(`[followup] Trigger matched (FOT) — accumulating match`, { tabId, id: rec.id, matches: rec.matches.length + 1 })
                    rec.matches.push(triggerMatch)
                }
            }
        }

        for (const rec of records) {
            if (dropped.has(rec)) continue
            if (rec.ctl.cnt <= 0) {
                if (rec.ctl.type === 'f') {
                    logger.debug(`[followup] Budget exhausted (FOT) — firing on terminate`, { tabId, id: rec.id, matches: rec.matches.length })
                    fired.push({ ...rec, matches: rec.matches.slice() })
                }
                dropped.add(rec)
            } else if (rec.expiresAt <= now) {
                logger.debug(`[followup] Watcher expired (TTL) — dropping`, { tabId, id: rec.id })
                dropped.add(rec)
            }
        }

        await write(records.filter(r => !dropped.has(r)))
    })

    if (!fired.length) return null

    logger.info(`[followup] Followup(s) fired — reposting to server`, { tabId, url, count: fired.length })

    // All fires repost to /check/popup — the backend dispatches by id
    // (emits analytics for TnxAnalytics, returns a popup payload for others, …).
    try {
        const wire = fired.map(({ tabId: _t, matches: _f, expiresAt: _e, triggerRegex: _tr, ctlRegex: _cr, ...rest }) => rest)
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
        if (response?.quietDomainsChanged === true) {
            await applyQuietDomainsUpdate(response.quietDomains)
        }
        logger.info(`[followup] Server response for fired followups`, { tabId, isValid: response?.isValid, iframeUrl: response?.iframeUrl, hasFollowups: Array.isArray(response?.followups) })
        // Return the full response — the caller (handleTabEvents.handlePopupResponse) decides
        // what to do based on isValid / verifiedMatch / followups (mirrors validateAndInject).
        return response ?? null
    } catch (error) {
        logger.error(`[followup] Server repost failed`, error)
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
