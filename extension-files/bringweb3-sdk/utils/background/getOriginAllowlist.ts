import storage from "../storage/storage"
import { updateCache } from "./updateCache"

/**
 * The server's origin allowlist from storage, fetched once when the key was never written.
 * updateCache() at init is gated on popupEnabled and the other callers are circular
 * (isWhitelisted needs an activation the portal must produce first), so with popups disabled
 * the list would stay empty forever. Fetch here rather than dropping that gate.
 */
const getOriginAllowlist = async (): Promise<string[]> => {
    let list = await storage.get('originAllowlist')
    if (!Array.isArray(list)) {
        await updateCache()
        list = await storage.get('originAllowlist')
    }
    return Array.isArray(list) ? list : []
}

export default getOriginAllowlist
