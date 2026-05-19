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
    activationPayload?: ActivateResponse | null
    activationMode?: string
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
    const isFast = !!body.activationPayload
    body.activationMode = isFast ? 'fastActivation' : 'standAloneActivation'
    const runActivate = fetch(`${API_URL}/activate`, {
        method: 'POST',
        keepalive: isFast,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(body)
    }).then(res => isFast ? undefined : res.json())

    if (body.activationPayload) {
        return body.activationPayload
    }
   
    return await runActivate
}

export default activate