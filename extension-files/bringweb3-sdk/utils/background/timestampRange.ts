export const isValidTimestampRange = (timestampRange: unknown): boolean => {
    if (!timestampRange || !Array.isArray(timestampRange) || timestampRange.length !== 2) {
        return false; // Invalid range
    }

    const [start, end] = timestampRange;

    // Check if both start and end are valid numbers and start is less than or equal to end
    return typeof start === 'number' && typeof end === 'number' && start <= end;
}

interface Config {
    maxRange?: number; // Maximum allowed range in milliseconds
}

export const isMsRangeExpired = (timestampRange: [number, number], now?: number, config?: Config): boolean => {
    if (!isValidTimestampRange(timestampRange)) {
        return true; // Invalid range, consider it expired
    }

    const [start, end] = timestampRange;
    now = now ?? Date.now();

    // Check if the current time is outside the range
    if (now < start || now > end) return true; // Range is expired

    if (config?.maxRange !== undefined) {
        const range = end - start;
        if (range > config.maxRange) {
            return true; // Range exceeds the maximum allowed range
        }
    }
    return false; // Range is valid and not expired
}

export const isMsRangeActive = (timestampRange: [number, number], now?: number, config?: Config): boolean => {
    return !isMsRangeExpired(timestampRange, now, config);
}