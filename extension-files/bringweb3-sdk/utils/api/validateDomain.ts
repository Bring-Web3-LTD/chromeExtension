import apiRequest from "./apiRequest"

interface ValidateDomainProps {
    body: {
        url: string,
        address: WalletAddress,
        country?: string
        phase?: 'new' | 'activated'
        quietDomains?: any[],
        matches: { match: string | string[], type: string }[]
    }
}

const validateDomain = async ({ body }: ValidateDomainProps) => {

    const res = await apiRequest({ path: '/check/popup', method: 'POST', params: body })

    return res
}

export default validateDomain;