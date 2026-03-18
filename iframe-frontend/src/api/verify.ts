import { API_URL, API_KEY } from "../config"

type Token = string | null

interface Req {
    token: Token
    userId: string
    styleUrl?: string | null
    themeMode: string
}

interface VerifyResponse {
    status: number
    info: Info
    theme?: Record<string, string> | { dark?: Record<string, string>; light?: Record<string, string> }
}

const verify = async ({ token, userId, styleUrl, themeMode }: Req): Promise<VerifyResponse> => {
    const body: Record<string, unknown> = {
        token,
        userId,
        timestamp: Date.now(),
        themeMode
    }

    if (styleUrl) {
        body.styleUrl = styleUrl
    }

    const res = await fetch(`${API_URL}/verify`, {
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

export default verify