import storage from "../storage/storage"
import { v4 as uuidv4, validate } from "uuid"

const getUserId = async (): Promise<string | undefined> => {
    let userId = await storage.get('id')
    if (!validate(userId)) { // If the userId is not a valid UUID
        userId = uuidv4()
        await storage.set('id', userId)
    }
    return userId
}

export default getUserId;