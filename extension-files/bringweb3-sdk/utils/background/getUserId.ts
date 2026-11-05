import storage from "../storage/storage"
import isUuid from "./isUuid"

// First-call writes share one promise: at install the onboarding request and updateCache
// both ask for an id before either has written one, and each would otherwise mint its own.
let creating: Promise<string> | null = null

const getUserId = async (): Promise<string | undefined> => {
    const userId = await storage.get('id')
    if (isUuid(userId)) return userId

    if (!creating) {
        creating = (async () => {
            const id = crypto.randomUUID()
            await storage.set('id', id)
            return id
        })().finally(() => { creating = null })
    }
    return creating
}

export default getUserId;
