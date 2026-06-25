import { ENV_ENDPOINT } from "../config";
import storage from "../storage/storage";

/**
 * Storage-gated debug logger.
 *
 * The `debugMode` flag sets the minimum level to emit (debug < info < warn < error);
 * below it is suppressed. Unset defaults to `debug` in dev/staging (ENV_ENDPOINT set)
 * and silent in production. Unrecognized values always emit nothing.
 *
 * `getLogger(module)` outputs `[<ISO>] [<LEVEL>] [<module>] <message>` with optional
 * context as a separate arg (keeps it inspectable in DevTools; Error stacks intact).
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

// Storage key for the debug flag (the storage module adds its own prefix).
const DEBUG_KEY = 'debugMode';

// Dev/staging builds default to verbose; production (no ENDPOINT injected) is silent.
const IS_DEV = !!ENV_ENDPOINT;

const hasStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;

// Current minimum level to emit; null means silent. Read synchronously on every log.
// Start silent when storage is available so we don't emit the env default before the
// stored debugMode value is known (which could briefly leak below-threshold logs in dev).
// Without storage (tests/non-extension) fall back to the env default.
let threshold: number | null = hasStorage ? null : resolveThreshold(undefined);
let initialized = false;

const isLogLevel = (value: unknown): value is LogLevel =>
    typeof value === 'string' && value in LEVEL_RANK;

/**
 * Map a stored flag value to a threshold rank.
 * - unset        -> env default (dev: debug, prod: silent)
 * - valid level  -> that level's rank
 * - unrecognized -> silent
 */
function resolveThreshold(raw: unknown): number | null {
    if (raw === undefined || raw === null) return IS_DEV ? LEVEL_RANK.debug : null;
    if (isLogLevel(raw)) return LEVEL_RANK[raw];
    return null;
}

// Refresh the cached threshold from storage. Bypasses the storage cache so changes
// made in another context (e.g. background) are picked up here (e.g. content script).
function refreshThreshold(): void {
    storage.get(DEBUG_KEY, false)
        .then((value) => { threshold = resolveThreshold(value); })
        .catch(() => { /* storage unavailable - keep current threshold */ });
}

/**
 * Lazy, one-time init. Deferred to a microtask so it doesn't touch the storage
 * module during the logger <-> storage circular import, and registers a listener
 * so the flag can be toggled live without a reload.
 */
function ensureInitialized(): void {
    if (initialized || !hasStorage) return;
    initialized = true;

    Promise.resolve().then(refreshThreshold);

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        // Raw keys are prefixed by the storage module; match suffix to stay prefix-agnostic.
        if (Object.keys(changes).some((key) => key.endsWith(DEBUG_KEY))) refreshThreshold();
    });
}

const shouldLog = (level: LogLevel): boolean =>
    threshold !== null && LEVEL_RANK[level] >= threshold;

export function getLogger(module: string): Logger {
    ensureInitialized();

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
