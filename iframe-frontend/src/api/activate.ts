import { API_URL, API_KEY } from "../config"

interface ActivateProps {
    userId: string
    walletAddress?: string
    platformName: string
    retailerId: string
    url: string
    domain?: string
    tokenSymbol: string
    flowId: string
    timestamp?: number
    isDemo?: boolean
    isOfferLine?: boolean
    isOfferBar?: boolean
    networkUrl?: string
    searchEngineDomain?: string
    offerBarPageUrl?: string
    offerBarSearch?: string
    activationMode?: string
    clickIdValue?: string
    activationToken?: string
    iframeUrl?: string
}

interface ActivateResponse {
    status: number
    flowId?: string
    url: string
    cashbackInfoUrl?: string
    generalTermsUrl?: string
    iframeUrl: string
    token: string
}

const activate = async (body: ActivateProps): Promise<ActivateResponse> => {
    body.timestamp = Date.now()
    const { activationToken, iframeUrl, ...payload } = body
    const runActivate = fetch(`${API_URL}/activate`, {
        method: 'POST',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(payload)
    }).then(res => res.json())

    if (body.activationMode === 'lightweight') {
        return {
            ...payload,
            status: 200,
            url: body.networkUrl!,
            iframeUrl: iframeUrl!,
            token: activationToken!
        } as ActivateResponse
    }
   
    return await runActivate
}

export default activate