import { logger } from "./logger"

// Base domain only - no scheme, no path, no port, no wildcard. 'bringweb3.io', not
// 'https://portal.bringweb3.io/'.
const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

const isValidDomain = (value: unknown): value is string =>
    typeof value === 'string' && value.length <= 253 && DOMAIN_RE.test(value)

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

    const valid = raw.filter(isValidDomain)
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
