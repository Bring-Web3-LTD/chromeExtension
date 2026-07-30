import storage from "../storage/storage"
import { formatUntil, isMsRangeActive } from "./timestampRange"
import { logger } from "../logger"

interface OptOut {
    isOptedOut: boolean
}

export const setOptOut = async (time: number): Promise<OptOut> => {
    if (time < 0) {
        await storage.remove('optOut')
        logger.debug(`[optout] Opt-out removed — popups allowed again on all website`)
        return { isOptedOut: false }
    } else {
        const now = Date.now()
        await storage.set('optOut', [now, now + time])
        logger.debug(`[optout] No popups on all website until ${formatUntil(now + time)}`, { time })
        return { isOptedOut: true }
    }
}

export const getOptOut = async (): Promise<OptOut> => {
    const optOut = await storage.get('optOut')
    const isOptedOut = isMsRangeActive(optOut)

    logger.debug(
        isOptedOut
            ? `[optout] Popups blocked on every website until ${formatUntil(optOut[1])}`
            : `[optout] Popups allowed on all websites`
    )

    return { isOptedOut };
}