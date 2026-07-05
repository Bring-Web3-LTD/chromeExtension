export const isValidTimestampRange = (timestampRange: unknown): boolean => {
    if (!timestampRange || !Array.isArray(timestampRange) || timestampRange.length !== 2) {
        return false; // Invalid range
    }

    const [start, end] = timestampRange;

    // Check if both start and end are valid numbers and start is less than or equal to end
    return typeof start === 'number' && typeof end === 'number' && start <= end;
}

export const isMsRangeExpired = (timestampRange: [number, number], now?: number): boolean => {
    if (!isValidTimestampRange(timestampRange)) {
        return true; // Invalid range, consider it expired
    }

    const [start, end] = timestampRange;
    now = now ?? Date.now();

    // Check if the current time is outside the range
    if (now < start || now > end) return true; // Range is expired

    return false; // Range is valid and not expired
}

export const isMsRangeActive = (timestampRange: [number, number], now?: number): boolean => {
    return !isMsRangeExpired(timestampRange, now);
}