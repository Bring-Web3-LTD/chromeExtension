import apiRequest from "./apiRequest"
import storage from "../storage/storage"

interface ValidateDomainProps {
    body: {
        url: string,
        address: WalletAddress,
        country?: string
        phase?: 'new' | 'activated'
        quietDomains?: any[],
        matches?: { match: string | string[], type: string }[],
        followups?: any[],
    }
}

// Server-driven quiet-domains sync. When the backend signals it has mutated the
// list (e.g. added/removed an entry as part of activation or a followup fire),
// we replace the stored list wholesale. Numeric `time` entries are normalized to
// absolute `[now, now+time]` ranges so storage only ever holds ms-ranges.
const applyQuietDomainsUpdate = async (response: any) => {
    if (!response || response.quietDomainsChanged !== true || !Array.isArray(response.quietDomains)) return
    const now = Date.now()
    const normalized = response.quietDomains.map((entry: any) =>
        entry && typeof entry.time === 'number'
            ? { ...entry, time: [now, now + entry.time] }
            : entry
    )
    await storage.set('quietDomains', normalized)
}

const validateDomain = async ({ body }: ValidateDomainProps) => {

    const res = await apiRequest({ path: '/check/popup', method: 'POST', params: body })

    await applyQuietDomainsUpdate(res)

    return res
}

export default validateDomain;