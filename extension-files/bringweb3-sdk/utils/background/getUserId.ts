import storage from "../storage/storage"
import isUuid from "./isUuid"

// Concurrent calls share one read-and-create: at install the onboarding request and
// updateCache both ask for an id before one exists, and each would otherwise mint its own.
let resolving: Promise<string> | null = null

const getUserId = (): Promise<string> => {
    if (resolving) return resolving
    return resolving = (async () => {
        const userId = await storage.get('id')
        if (isUuid(userId)) return userId
        const id = crypto.randomUUID()
        await storage.set('id', id)
        return id
    })().finally(() => { resolving = null })
}

export default getUserId;
