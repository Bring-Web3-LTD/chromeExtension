import apiRequest from "./apiRequest"

interface AnalyticEvent {
    type: string
    userId?: string
    walletAddress?: string
    category?: string
    action?: string
    process?: string
    details?: unknown
    flowId?: string,
    page?: string,
    domain?: string,
    entry?: string,
}


const analytics = async (body: AnalyticEvent | AnalyticEvent[]) => {
    const isArray = Array.isArray(body)

    if (isArray) {
        body.forEach(e => e.category = e.category || 'system')
    } else {
        body.category = body?.category || 'system'
    }

    await apiRequest({
        path: '/analytics',
        method: 'POST',
        params: isArray ? { events: body } : body
    })
}

export default analytics