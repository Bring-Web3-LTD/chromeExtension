import apiRequest from "../api/apiRequest"
import storage from "../storage/storage"
import getUserId from "./getUserId"
import getOriginAllowlist from "./getOriginAllowlist"
import { isAllowedOrigin } from "../originAllowlist"
import { logger } from "../logger"

const REQUEST_TIMEOUT = 30000
// campaignAttributions columns are VARCHAR(255); the server rejects longer values anyway.
const MAX_ID_LENGTH = 255

export type OnboardingPage = 'start' | 'embed'

interface OnboardingConfig {
    origin?: string
    startUrl?: string
    embedUrl?: string
}

interface OnboardingClick {
    campaignId: string
    clickId: string
    sent: boolean
}

// Per-platform welcome URLs; a platform without an entry gets none. Anything but a 200 body
// is a failure (the handler puts the status in the body), not "no welcome page".
const fetchOnboardingConfig = async (): Promise<OnboardingConfig> => {
    const res = await apiRequest({ path: '/onboarding/config', method: 'GET', timeout: REQUEST_TIMEOUT })
    if (res?.status !== 200) throw new Error(`onboarding config failed: ${res?.status ?? 'no status'}`)
    return res
}

// The welcome page reads this id back from the URL and puts it on every message it posts, so
// our content script can tell our messages from another kit extension's on the same page.
const withExtensionId = (url: string) => {
    const parsed = new URL(url)
    parsed.searchParams.set('extensionId', chrome.runtime.id)
    return parsed.toString()
}

/** The welcome URL the partner asked for, with our extensionId on it. Undefined when the platform has none. */
export const getOnboardingUrl = async (page: OnboardingPage): Promise<string | undefined> => {
    const config = await fetchOnboardingConfig()
    // The partner may open this page on an install that never went through openWelcomePage;
    // the content script only wakes up on the stored origin.
    if (config.origin) await storage.set('onboardingOrigin', config.origin)
    const url = page === 'embed' ? config.embedUrl : config.startUrl
    return url ? withExtensionId(url) : undefined
}

/**
 * Where the welcome page's "Go to Rewards" asked to go. The page takes it from its own URL
 * (`rewardsUrl`, put there by our backend), so anyone can craft a /start link with their own:
 * only an https url whose host is on the server's origin allowlist is opened. Undefined means
 * the caller falls back to cashbackPagePath.
 */
export const allowedRewardsUrl = async (url: unknown): Promise<string | undefined> => {
    if (typeof url !== 'string' || !url) return undefined
    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        logger.warn(`[onboarding] Rewards url ignored - not a url`)
        return undefined
    }
    if (parsed.protocol !== 'https:' || !isAllowedOrigin(parsed.origin, await getOriginAllowlist())) {
        logger.warn(`[onboarding] Rewards url ignored - not an https url on the origin allowlist`, { origin: parsed.origin })
        return undefined
    }
    return parsed.toString()
}

// One attempt at a time: at install the onInstalled listener and the pending retry can both
// ask for it before either has finished.
let opening: Promise<void> | null = null

/**
 * First install: generate the userId, fetch the welcome config and open the welcome page.
 * The pending flag is set before the request, so an attempt that fails or is interrupted
 * is retried on the next worker start.
 */
const openWelcomePage = (): Promise<void> => {
    if (opening) return opening
    return opening = (async () => {
        await storage.set('onboardingPending', true)
        // Written before any request goes out, so every request from this install carries it.
        await getUserId()

        const { origin, startUrl } = await fetchOnboardingConfig()
        if (!origin || !startUrl) {
            logger.info(`[onboarding] No welcome page for this platform`)
            await storage.remove('onboardingPending')
            return
        }

        // The only origin the content script reads campaignId / clickId from.
        await storage.set('onboardingOrigin', origin)
        // Cleared before the tab opens: a worker killed in between must not open it twice.
        await storage.remove('onboardingPending')
        const url = withExtensionId(startUrl)
        logger.info(`[onboarding] Opening the welcome page`, { url })
        try {
            await chrome.tabs.create({ url })
        } catch (error) {
            logger.error(`[onboarding] Failed to open the welcome page, will retry on the next start`, { error })
            await storage.set('onboardingPending', true)
        }
    })().finally(() => { opening = null })
}

/**
 * Pair this install with the click it came from. On 200 the campaign is kept for the rest of
 * the install (apiRequest puts it on every request). A rejection (4xx, or no status at all)
 * is final: the server won't take it later either. Anything else is kept for a retry.
 */
const sendOnboardingClick = async (): Promise<void> => {
    const click: OnboardingClick | undefined = await storage.get('onboardingClick')
    if (!click || click.sent) return

    const { campaignId, clickId } = click
    const res = await apiRequest({ path: '/onboarding/click', method: 'POST', params: { campaignId, clickId }, timeout: REQUEST_TIMEOUT })

    // A newer click may have been captured while this one was in flight; its result is the
    // one that counts, so this (stale) outcome must not overwrite it.
    const current: OnboardingClick | undefined = await storage.get('onboardingClick')
    if (current?.clickId !== clickId) {
        logger.debug(`[onboarding] Click result discarded - a newer click replaced it`, { clickId })
        return
    }

    if (res?.status === 200) {
        logger.info(`[onboarding] Click paired with this install`, { campaignId })
        await storage.set('onboardingCampaignId', campaignId)
    } else if (typeof res?.status !== 'number' || (res.status >= 400 && res.status < 500)) {
        logger.warn(`[onboarding] Click rejected by the server, not retrying`, { campaignId, status: res?.status, message: res?.message })
    } else {
        throw new Error(`onboarding click failed: ${res.status}`)
    }
    await storage.set('onboardingClick', { ...click, sent: true })
}

/**
 * The content script found campaignId / clickId on the welcome origin. Only that origin is
 * believed: the sender's origin has to match the one the server returned.
 */
const captureOnboardingClick = async (senderOrigin: string | undefined, campaignId: unknown, clickId: unknown): Promise<void> => {
    const origin = await storage.get('onboardingOrigin')
    if (!origin || senderOrigin !== origin) {
        logger.warn(`[onboarding] Capture ignored - not from the welcome origin`, { senderOrigin })
        return
    }
    if (typeof campaignId !== 'string' || typeof clickId !== 'string' || !campaignId || !clickId
        || campaignId.length > MAX_ID_LENGTH || clickId.length > MAX_ID_LENGTH) {
        logger.warn(`[onboarding] Capture ignored - invalid campaignId or clickId`)
        return
    }
    // The welcome tab reports on every load; the same click once is enough.
    // ponytail: two reports in the same tick can both POST; the server upserts, so no harm.
    const previous: OnboardingClick | undefined = await storage.get('onboardingClick')
    if (previous?.clickId === clickId && previous.sent) return

    await storage.set('onboardingClick', { campaignId, clickId, sent: false })
    await sendOnboardingClick()
}

/**
 * The onboarding messages, on their own listener so none of this touches the shared one.
 * Registered synchronously; each handler waits for `ready` (bringInitBackground) before acting.
 */
const handleOnboardingMessages = (ready: Promise<unknown>) => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request?.from !== 'bringweb3') return
        const { action } = request

        switch (action) {
            case 'ONBOARDING_CAPTURE': {
                // The welcome origin's content script found the campaign the user came from.
                const { campaignId, clickId } = request
                // sender.origin is MV3 only; sender.url covers MV2.
                const senderOrigin = sender.origin || (sender.url ? new URL(sender.url).origin : undefined)
                logger.info(`[onboarding-bg] ${action} event received`)
                ready.then(() => captureOnboardingClick(senderOrigin, campaignId, clickId))
                    .catch(error => logger.error(`[onboarding-bg] failed to record the click, will retry on the next start`, { error }))
                    .then(() => sendResponse())
                return true;
            }
            case 'GET_ONBOARDING_URL': {
                const { page } = request
                logger.info(`[onboarding-bg] ${action} event received`)
                if (page !== 'start' && page !== 'embed') {
                    logger.warn(`[onboarding-bg] ${action} ignored - unknown page`, { page })
                    sendResponse({})
                    return true;
                }
                ready.then(() => getOnboardingUrl(page))
                    .then(url => sendResponse({ url }))
                    .catch(error => {
                        logger.error(`[onboarding-bg] failed to resolve the onboarding url`, { error })
                        sendResponse({ error: 'failed to resolve the onboarding url' })
                    })
                return true;
            }
            default:
                return
        }
    })
}

/** Worker start: finish whatever an earlier run left behind. */
const retryPendingOnboarding = async (): Promise<void> => {
    if (await storage.get('onboardingPending')) {
        logger.info(`[onboarding] Retrying the welcome page from an earlier failed attempt`)
        await openWelcomePage().catch(error => logger.error(`[onboarding] Welcome page retry failed`, { error }))
    }
    await sendOnboardingClick().catch(error => logger.error(`[onboarding] Click retry failed`, { error }))
}

/**
 * Background side of the onboarding flow (bringInitBackground with `onboarding: { on: true }`): on first
 * install, create the userId, ask Bring for the welcome page and open it; the welcome page then
 * hands the kit the campaign the user came from. Listeners are registered synchronously, so this
 * must run before the first await of the init; the work itself waits for `ready`.
 */
export const initOnboarding = (ready: Promise<unknown>) => {
    // Updates, reloads and browser updates are not an install and open nothing.
    chrome.runtime.onInstalled.addListener(({ reason }) => {
        if (reason !== 'install') return
        logger.info(`[onboarding] First install`)
        ready.then(openWelcomePage)
            .catch(error => logger.error(`[onboarding] Failed to open the welcome page, will retry on the next start`, { error }))
    })

    handleOnboardingMessages(ready)

    ready.then(retryPendingOnboarding)
        .catch(error => logger.error(`[onboarding] Not started`, { error }))
}
