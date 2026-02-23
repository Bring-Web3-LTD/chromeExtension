import { API_URL, API_KEY } from "../config"

interface ActivateProps {
    userId: string
    walletAddress?: string
    platformName: string
    retailerId: string
    url: string
    tokenSymbol: string
    flowId: string
    timestamp?: number
    isDemo?: boolean
    isOfferLine?: boolean
    isOfferBar?: boolean
    networkUrl?: string
    searchEngineDomain?: string
    offerBarPageUrl?: string
    offerBarSearch?: string,
    activationUrl?: string,
    activationMode?: string,
    clickIdValue?: string
}

interface ActivateResponse {
    status: number
    flowId: string
    url: string
    cashbackInfoUrl: string
    generalTermsUrl: string
    iframeUrl: string
    token: string
}

const activate = async (body: ActivateProps): Promise<ActivateResponse> => {
    body.timestamp = Date.now()
    const runActivate = fetch(`${API_URL}/activate`, {
        method: 'POST',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(body)
    })

    if (body.activationMode === 'lightweight' && body.activationUrl) {
        return {
            status: 200,
            flowId: body.flowId,
            url: body.activationUrl,
            cashbackInfoUrl: 'N/A',
            generalTermsUrl: 'N/A',
            iframeUrl: 'N/A',
            token: 'N/A'
        }
    }

    const res = await runActivate
    const json = await res.json()
    return json
}

export default activate