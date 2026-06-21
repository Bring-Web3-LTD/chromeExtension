import { ENV_ENDPOINT } from "../config";

/**
 * Storage-gated debug logger.
 *
 * Logs are emitted only when the `debugMode` flag in chrome.storage.local is set
 * to a level. The flag value is the *minimum* level to emit (debug < info < warn
 * < error); everything below it is suppressed. When the flag is unset or holds an
 * unrecognized value, nothing logs.
 *
 * The flag is read directly from chrome.storage.local (not the storage module) so
 * the logger works in both the background service worker and content scripts.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
    debug: (message: string, context?: unknown) => void;
    info: (message: string, context?: unknown) => void;
    warn: (message: string, context?: unknown) => void;
    error: (message: string, context?: unknown) => void;
}

// Lower rank = more verbose. The flag's rank is the minimum that gets emitted.
const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// chrome.storage key, kept in sync with STORAGE_PREFIX ('bring_') in storage.ts.
const DEBUG_KEY = 'bring_debugMode';

// Dev/staging builds default to verbose; production (no ENDPOINT injected) is silent.
const IS_DEV = !!ENV_ENDPOINT;

// Current minimum level to emit; null means silent. Read synchronously on every log.
let threshold: number | null = resolveThreshold(undefined);

const isLogLevel = (value: unknown): value is LogLevel =>
    typeof value === 'string' && value in LEVEL_RANK;

/**
 * Map a stored flag value to a threshold rank.
 * - unset            -> env default (dev: debug, prod: silent)
 * - valid level      -> that level's rank
 * - unrecognized     -> silent
 */
function resolveThreshold(raw: unknown): number | null {
    if (raw === undefined || raw === null) return IS_DEV ? LEVEL_RANK.debug : null;
    if (isLogLevel(raw)) return LEVEL_RANK[raw];
    return null;
}

const hasStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;

// Load the flag once and keep it live across changes (toggle without reload).
if (hasStorage) {
    chrome.storage.local.get([DEBUG_KEY], (data) => {
        if (chrome.runtime.lastError) return;
        threshold = resolveThreshold(data[DEBUG_KEY]);
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local' || !(DEBUG_KEY in changes)) return;
        threshold = resolveThreshold(changes[DEBUG_KEY]?.newValue);
    });
}

const shouldLog = (level: LogLevel): boolean =>
    threshold !== null && LEVEL_RANK[level] >= threshold;

/**
 * Get a logger bound to a module tag (e.g. 'background', 'content', 'bringCache').
 * Output: `[<ISO timestamp>] [<LEVEL>] [<module>] <message>` with optional context
 * passed as a separate argument so DevTools keeps it inspectable (and Error stacks intact).
 */
export function getLogger(module: string): Logger {
    const emit = (level: LogLevel, message: string, context?: unknown): void => {
        if (!shouldLog(level)) return;
        const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${module}] ${message}`;
        if (context !== undefined) {
            console[level](line, context);
        } else {
            console[level](line);
        }
    };

    return {
        debug: (message, context) => emit('debug', message, context),
        info: (message, context) => emit('info', message, context),
        warn: (message, context) => emit('warn', message, context),
        error: (message, context) => emit('error', message, context),
    };
}

export default getLogger;
