import storage from "../storage/storage";

/**
 * Storage-gated debug logger. Disabled by default.
 *
 * The `debugMode` flag sets the minimum level to emit (debug < info < warn < error);
 * below it is suppressed. Unset or unrecognized value = nothing logs. Enable it by
 * setting the flag, e.g. in the background `bringCache.set('debugMode', 'debug')`.
 *
 * Outputs `[<ISO>] [<LEVEL>] <message>` with optional context as a separate arg
 * (keeps it inspectable in DevTools; Error stacks intact).
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

const hasStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;

// Current minimum level to emit; null = silent (disabled by default until the flag is read).
let threshold: number | null = null;

// Refresh the cached threshold from storage. Bypasses the storage cache so changes
// made in another context (e.g. background) are picked up here (e.g. content script).
// Unset or unrecognized value -> null (silent).
function refreshThreshold(): void {
    storage.get(DEBUG_KEY, false)
        .then((value) => {
            threshold = typeof value === 'string' && value in LEVEL_RANK
                ? LEVEL_RANK[value as LogLevel]
                : null;
        })
        .catch(() => { /* storage unavailable - keep current threshold */ });
}

// Load the flag once at startup and keep it live. Deferred to a microtask so it doesn't
// touch the storage module during the logger <-> storage circular import. The listener
// lets the flag be toggled without a reload (and picks up changes from other contexts).
if (hasStorage) {
    Promise.resolve().then(refreshThreshold);

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        // Raw keys are prefixed by the storage module; match suffix to stay prefix-agnostic.
        if (Object.keys(changes).some((key) => key.endsWith(DEBUG_KEY))) refreshThreshold();
    });
}

const shouldLog = (level: LogLevel): boolean =>
    threshold !== null && LEVEL_RANK[level] >= threshold;

const emit = (level: LogLevel, message: string, context?: unknown): void => {
    if (!shouldLog(level)) return;
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    if (context !== undefined) {
        console[level](line, context);
    } else {
        console[level](line);
    }
};

export const log: Logger = {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),
};

export default log;
