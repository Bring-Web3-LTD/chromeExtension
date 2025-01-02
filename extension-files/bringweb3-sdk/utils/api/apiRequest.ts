import { ApiEndpoint } from "../apiEndpoint"
import getVersion from "../getVersion"
import storage from "../storage"

interface Request {
    path: string
    method: 'POST' | 'GET'
    apiKey: string
    params?: { [key: string]: any }
}


const apiRequest = async (req: Request) => {
    let { path, method, apiKey, params } = req
    if (!req || !path || !method || (!params && method === 'POST') || !apiKey) throw new Error('Missing endpoint or method')

    let endpoint = ApiEndpoint.getInstance().getApiEndpoint()
    endpoint += path

    if (method === 'GET') {
        const urlParams = new URLSearchParams({
            ...params,
            version: getVersion(),
            opt_out: await storage.get('optOut') || 0,
            user_id: await storage.get('id') || 'undefined',
            wallet_address: await storage.get('walletAddress') || 'undefined'
        })
        endpoint += `?${urlParams.toString()}`
    } else if (method === 'POST') {
        params = {
            ...params,
            version: getVersion(),
            optOut: await storage.get('optOut') || 0,
            userId: await storage.get('id') || undefined,
            walletAddress: params?.walletAddress || await storage.get('walletAddress') || undefined
        }
    }

    const res = await fetch(endpoint, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: method === 'POST' ? JSON.stringify(params) : undefined
    })
    const json = await res.json()
    return json
}

export default apiRequest;