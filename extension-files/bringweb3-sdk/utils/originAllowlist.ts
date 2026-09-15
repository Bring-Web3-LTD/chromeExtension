import { normalizeUrl } from "./normalizeUrl"

// Both sides go through the same normalizer, so 'www.partner.com' and 'partner.com'
// can't disagree about what a host is.
const hostOf = (value: string) => normalizeUrl(value, { hostOnly: true, reverseHost: false })

/**
 * An origin whose host is an allowlisted domain or a subdomain of one.
 * The dot anchor is what makes the suffix safe: a bare endsWith('partner.com') would
 * also match evil-partner.com.
 */
export const isAllowedOrigin = (origin: string, allowlist: string[]): boolean => {
    const host = hostOf(origin)
    if (!host) return false

    return allowlist.some(domain => {
        const allowed = hostOf(domain)
        return !!allowed && (host === allowed || host.endsWith(`.${allowed}`))
    })
}
