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
    offerBarSearch?: string,
    activationUrl?: string,
    activationMode?: string,
    clickIdValue?: string,
    activationToken?: string
}

interface ActivateResponse extends Partial<ActivateProps> {
    status: number
    url: string
    token: string
    iframeUrl: string
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

    if (body.activationMode === 'lightweight') {
        const { activationToken, activationUrl, ...rest } = body
        return {
            ...rest,
            status: 200,
            iframeUrl: activationUrl!,
            token: activationToken!
        }
    }

    const res = await runActivate
    const json = await res.json()
    return json
}

export default activate