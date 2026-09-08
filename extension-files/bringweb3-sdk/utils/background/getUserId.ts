import storage from "../storage/storage"
import isUuid from "./isUuid"

const getUserId = async (): Promise<string | undefined> => {
    let userId = await storage.get('id')
    if (!isUuid(userId)) { // If the userId is not a valid UUID
        userId = crypto.randomUUID()
        await storage.set('id', userId)
    }
    return userId
}

export default getUserId;