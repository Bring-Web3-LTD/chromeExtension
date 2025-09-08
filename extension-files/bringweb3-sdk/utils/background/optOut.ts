import storage from "../storage/storage"
import { isMsRangeActive } from "./timestampRange"

interface OptOut {
    isOptedOut: boolean
}

export const setOptOut = async (time: number): Promise<OptOut> => {
    if (time < 0) {
        await storage.remove('optOut')
        return { isOptedOut: false }
    } else {
        const now = Date.now()
        await storage.set('optOut', [now, now + time])
        return { isOptedOut: true }
    }
}

export const getOptOut = async (): Promise<OptOut> => {
    const optOut = await storage.get('optOut')

    return { isOptedOut: isMsRangeActive(optOut) };
}