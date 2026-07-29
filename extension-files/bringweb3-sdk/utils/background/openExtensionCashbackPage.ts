import { logger } from "../logger";

export const openExtensionCashbackPage = (page: string) => {
    if (!page) {
        logger.warn(`[cashback-page] Cashback page not opened — no URL in the request and no cashbackPagePath configured`)
        return
    }
    logger.debug(`[cashback-page] Opening cashback page in a new tab`, { page })
    chrome.tabs.create({
        url: page
    });
}