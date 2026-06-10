import apiRequest from "./apiRequest"

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

const validateDomain = async ({ body }: ValidateDomainProps) => {
    return apiRequest({ path: '/check/popup', method: 'POST', params: body })
}

export default validateDomain;