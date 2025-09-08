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

    const res = await fetch(`${API_URL}/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(body)
    })

    const json = await res.json()

    return json
}

export default activate