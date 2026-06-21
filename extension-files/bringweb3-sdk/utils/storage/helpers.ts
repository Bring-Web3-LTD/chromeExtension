import { getLogger } from "../logger/logger";

const log = getLogger('bringCache');

interface Helpers {
    [key: string]: {
        get: (...args: any[]) => any;
        set: (...args: any[]) => any;
    }
}

export const strToUint8Array = (str: string): Uint8Array | null => {
    try {
        const decoded = atob(str);
        const arr = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            arr[i] = decoded.charCodeAt(i);
        }
        return arr;
    } catch (error) {
        return null
    }
}

export const uint8ArrayToStr = (blob: Uint8Array): string => {
    const arr = [];
    for (let i = 0; i < blob.length; i += 1000) {
        const next = Math.min(i + 1000, blob.length)
        arr.push(String.fromCharCode(...blob.slice(i, next)))
    }
    return btoa(arr.join(''))
}

const buildRegExpArray = (obj: { regexes: string[], flags: string[] }) => {
    try {
        return obj.regexes.map((pattern, i) => new RegExp(pattern, obj.flags[i] || ''))
    } catch (error) {
        log.error('failed to build RegExp array', { error })
        return null
    }
}

// Compile each followup's `trigger` + `ctl.regex` to RegExp once on storage
// so navigation matching reuses the cached RegExp instead of recompiling on every page load.
// chrome.storage keeps the raw string form; the cache holds the compiled form.
const buildFollowupRegexes = (records: any) => {
    if (!Array.isArray(records)) return records
    return records.map(r => {
        try {
            return { ...r, triggerRegex: new RegExp(r.trigger), ctlRegex: new RegExp(r.ctl.regex) }
        } catch (error) {
            log.error('failed to build followup RegExp', { error })
            return r
        }
    })
}

const helpers: Helpers = {
    relevantDomains: {
        get: buildRegExpArray,
        set: buildRegExpArray
    },
    followups: {
        get: buildFollowupRegexes,
        set: buildFollowupRegexes
    }
}

export default helpers;