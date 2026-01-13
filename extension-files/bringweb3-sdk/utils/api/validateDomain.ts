import apiRequest from "./apiRequest"

interface ValidateDomainProps {
    body: {
        url: string,
        urlMatch?: string|string[],
        address: WalletAddress,
        country?: string
        phase?: 'new' | 'activated'
        type?: string,
        quietDomains?: any[]
    }
}

const validateDomain = async ({ body }: ValidateDomainProps) => {

    const res = await apiRequest({ path: '/check/popup', method: 'POST', params: body })

    return res
}

export default validateDomain;