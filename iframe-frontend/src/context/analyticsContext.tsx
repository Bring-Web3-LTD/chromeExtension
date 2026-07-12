import { FC, createContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { TEST_ID } from '../config';
import { VariantKey } from '../utils/ABTest/platform-variants';
import analytics from '../api/analytics';
import { useWalletAddress } from '../hooks/useWalletAddress';

type EventName = 'retailer_shop' | 'popup_close' | 'opt_out' | 'opt_out_specific' | 'retailer_activation' | 'page_view' | 'beamer' | 'wallet_connected' | 'wallet_switched' | 'wallet_disconnected'

interface AnalyticsEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request"| "timeout";
    details?: string | object;    
    process?: "activate" | "initiate" | "submit";
}

interface BackendEvent {
    category?: "user_action" | "system";
    action?: "click" | "input" | "select" | "request" | "timeout";
    details?: unknown;
    process?: "activate" | "initiate" | "submit";
}


export const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Move these outside the component to persist across remounts
const sentEvents = new Set<EventName>()
const pendingPromises = new Map<EventName, Promise<{ success: boolean; error?: Error; skipped?: boolean }>>()
let pageViewSent = false

interface Props {
    children: ReactNode
    platform: string
    userId: string | undefined
    testVariant: VariantKey
    retailerName: string | undefined
    location: string
    flowId: string
    searchEngineDomain: string | undefined
    verifiedMatch: { match: string; isRegex: boolean } | undefined
    offerBarSearch: string | undefined
    domain: string
    inlineSearchLink: string | undefined
    matchedKeyword: string | undefined
    isOfferBar: boolean | undefined
}

export const AnalyticsProvider: FC<Props> = ({ children, platform, testVariant, userId, retailerName, location, flowId, searchEngineDomain, verifiedMatch, offerBarSearch, domain, inlineSearchLink, matchedKeyword, isOfferBar }) => {
    const isInitialMount = useRef(true)
    const { walletAddress } = useWalletAddress()
    const previousWalletAddressRef = useRef<string | undefined>(walletAddress)

    const sendBackendEvent = useCallback(async (name: EventName, event: BackendEvent) => {
        const timestamp = Date.now()
        // Check if this event type has already been sent successfully
        if (sentEvents.has(name)) {
            return { success: true, skipped: true }
        }

        // If there's a pending promise for this event, wait for it
        if (pendingPromises.has(name)) {
            try {
                await pendingPromises.get(name)
                // After waiting, check if it was sent successfully
                if (sentEvents.has(name)) {
                    return { success: true, skipped: true }
                }
            } catch (error) {
                // If the previous attempt failed, we'll try again
            }
        }

        const backendEvent: Parameters<typeof analytics>[0] = {
            ...event,
            type: name,
            platform,
            testId: TEST_ID,
            testVariant,
            flowId,
        }

        if (retailerName) backendEvent.retailer = retailerName
        if (walletAddress) backendEvent.walletAddress = walletAddress
        if (userId) backendEvent.userId = userId
        if (searchEngineDomain) backendEvent.searchEngine = searchEngineDomain
        if (offerBarSearch) backendEvent.searchQuery = offerBarSearch
        if (domain) backendEvent.resultDomain = domain
        if (inlineSearchLink) backendEvent.resultUrl = inlineSearchLink
        if (matchedKeyword) backendEvent.matchedKeyword = matchedKeyword
        if (isOfferBar !== undefined) backendEvent.isOfferBar = isOfferBar
        
        // Calculate triggerType based on verifiedMatch
        const triggerType = verifiedMatch?.isRegex === true ? 'keyword' : 'domain'
        backendEvent.triggerType = triggerType


        // Create the promise for this event
        const eventPromise = (async () => {
            try {
                const result = await analytics(backendEvent, timestamp)
                if (result.success) {
                    sentEvents.add(name)
                }
                return result
            } catch (error) {
                console.error('BRING: Error sending analytics event', error)
                return { success: false, error: error as Error }
            } finally {
                pendingPromises.delete(name)
            }
        })()

        // Store the promise
        pendingPromises.set(name, eventPromise)

        return eventPromise
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowId, platform, retailerName, testVariant, userId, walletAddress])

    // Track wallet address changes
    useEffect(() => {
        if (window.origin.includes('localhost')) {
            return
        }

        // Skip the very first mount
        if (isInitialMount.current) {
            isInitialMount.current = false
            previousWalletAddressRef.current = walletAddress
            return
        }

        const prev = previousWalletAddressRef.current
        const current = walletAddress

        // Only send event if wallet address actually changed
        if (prev !== current) {
            const details = {
                prevWalletAddress: prev ?? null,
                currentWalletAddress: current ?? null
            }

            if (!prev && current) {
                // No wallet → wallet: user connected a wallet
                sendAnalyticsEvent('wallet_connected', {
                    category: 'user_action',
                    action: 'click',
                    details
                })
            } else if (prev && current) {
                // Wallet A → wallet B: user switched wallets
                sendAnalyticsEvent('wallet_switched', {
                    category: 'user_action',
                    action: 'click',
                    details
                })
            } else if (prev && !current) {
                // Wallet → no wallet: user disconnected
                sendAnalyticsEvent('wallet_disconnected', {
                    category: 'user_action',
                    action: 'click',
                    details
                })
            }
        }
        
        previousWalletAddressRef.current = walletAddress
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletAddress])

    useEffect(() => {
        if (window.origin.includes('localhost')) {
            return
        }

        if (pageViewSent) return
        pageViewSent = true

        const details: { [key: string]: string } = {
            pageLocation: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            parentLocation: location
        }
        if (retailerName) details.retailer = retailerName

        sendBackendEvent('page_view', {
            category: 'system',
            details
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendAnalyticsEvent = async (name: EventName, event: AnalyticsEvent): Promise<void> => {
        if (window.origin.includes('localhost')) return

        await sendBackendEvent(name, event)
    };

    return (
        <AnalyticsContext.Provider value={{ sendAnalyticsEvent }}>
            {children}
        </AnalyticsContext.Provider>
    );
};