import { logger } from "./logger"

// One hostname label: alphanumeric ends, hyphens only inside (RFC 1123).
const LABEL_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

// Base domain only - no scheme, no path, no port, no wildcard. 'bringweb3.io', not
// 'https://portal.bringweb3.io/'. Compared against URL.hostname, which is lowercase.
const isValidDomain = (value: unknown): value is string => {
    if (typeof value !== 'string' || value.length > 253) return false
    const labels = value.split('.')
    return labels.length > 1 && labels.every(label => label.length <= 63 && LABEL_RE.test(label))
}

/**
 * Validates the originAllowlist field of a /domains response.
 * Returns the list to store, or null when the caller should keep the previous list.
 */
export const sanitizeOriginAllowlist = (raw: unknown): string[] | null => {
    if (!Array.isArray(raw)) {
        // An absent field is a valid "nothing allowed"; anything else is malformed.
        if (raw != null) logger.warn(`[origins] originAllowlist isn't an array - keeping the previous list`, { raw })
        return raw == null ? [] : null
    }

    // Domains are case-insensitive, so 'Partner.com' is a valid entry - fold it to the
    // lowercase form URL.hostname will be compared against.
    const valid = raw.map(entry => typeof entry === 'string' ? entry.trim().toLowerCase() : entry).filter(isValidDomain)
    if (valid.length !== raw.length) {
        logger.warn(`[origins] Dropped invalid entries from originAllowlist`, { kept: valid.length, received: raw.length })
    }
    return valid
}

/**
 * An https origin whose host is an allowlisted domain or a subdomain of one.
 * The dot anchor is what makes the suffix safe: a bare endsWith('partner.com') would
 * also match evil-partner.com.
 */
export const isAllowedOrigin = (origin: string, allowlist: string[]): boolean => {
    let host: string
    try {
        const url = new URL(origin)
        if (url.protocol !== 'https:') return false
        host = url.hostname
    } catch {
        return false
    }
    return allowlist.some(domain => host === domain || host.endsWith(`.${domain}`))
}
