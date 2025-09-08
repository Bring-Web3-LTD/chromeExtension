import { ApiEndpoint } from "../apiEndpoint"
import getUserId from "../background/getUserId"
import getVersion from "../getVersion"
import storage from "../storage/storage"

interface Request {
    path: string
    method: 'POST' | 'GET'
    params?: { [key: string]: any }
}


const apiRequest = async (req: Request) => {
    let { path, method, params } = req
    if (!req || !path || !method || (!params && method === 'POST')) throw new Error('Missing endpoint or method')

    let endpoint = ApiEndpoint.getInstance().getApiEndpoint()
    endpoint += path
    const apiKey = ApiEndpoint.getInstance().getApiKey()

    if (method === 'GET') {
        const urlParams = new URLSearchParams({
            ...params,
            version: getVersion(),
            timestamp: Date.now().toString(),
            opt_out: await storage.get('optOut') || 0,
            user_id: await getUserId() || 'undefined',
            wallet_address: await storage.get('walletAddress') || 'undefined'
        })
        endpoint += `?${urlParams.toString()}`
    } else if (method === 'POST') {
        params = {
            ...params,
            version: getVersion(),
            timestamp: Date.now(),
            optOut: await storage.get('optOut') || 0,
            userId: await getUserId() || undefined,
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