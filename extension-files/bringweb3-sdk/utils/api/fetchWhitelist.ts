import { ApiEndpoint } from "../apiEndpoint"

export const fetchWhitelist = async (timeout?: number) => {
    try {
        const endpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

        if (!endpoint) {
            return []
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-store', // Prevents caching
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache'
            },
            signal: timeout && 'timeout' in AbortSignal ? AbortSignal.timeout(timeout) : undefined
        })

        if (!response.ok) {
            throw new Error('Failed to fetch whitelist')
        }

        let whitelist = await response.json()

        if (!Array.isArray(whitelist)) {
            throw new Error("whitelist isn't an array")
        }


        return whitelist
    } catch (error) {
        console.error('Error fetching whitelist:', error)
        return []
    }
}

