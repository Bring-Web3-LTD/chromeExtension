import { FC, createContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import ReactGA from 'react-ga4';
import { TEST_ID } from '../config';
import { VariantKey } from '../utils/ABTest/platform-variants';
import analytics from '../api/analytics';
import { useWalletAddress } from '../hooks/useWalletAddress';

type EventName = 'retailer_shop' | 'popup_close' | 'opt_out' | 'opt_out_specific' | 'retailer_activation' | 'page_view' | 'beamer'

interface GAEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: string;
    process?: "activate" | "initiate" | "submit";
}

interface BackendEvent {
    category?: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: unknown;
    process?: "activate" | "initiate" | "submit";
}


export const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType | undefined>(undefined);

interface Props {
    measurementId: string
    children: ReactNode
    platform: string
    userId: string | undefined
    testVariant: VariantKey
    retailerName: string | undefined
    location: string
    flowId: string
}

export const GoogleAnalyticsProvider: FC<Props> = ({ measurementId, children, platform, testVariant, userId, retailerName, location, flowId }) => {
    const effectRan = useRef(false)
    const { walletAddress } = useWalletAddress()
    // Track which events have been sent
    const sentEvents = useRef<Set<EventName>>(new Set())
    // Track pending event requests
    const pendingEvents = useRef<Set<EventName>>(new Set())
    // Track promises for pending events
    const pendingPromises = useRef<Map<EventName, Promise<{ success: boolean; error?: Error; skipped?: boolean }>>>(new Map())

    const sendBackendEvent = useCallback(async (name: EventName, event: BackendEvent) => {
        // Check if this event type has already been sent successfully
        if (sentEvents.current.has(name)) {
            return { success: true, skipped: true }
        }

        // If there's a pending promise for this event, wait for it
        if (pendingPromises.current.has(name)) {
            try {
                await pendingPromises.current.get(name)
                // After waiting, check if it was sent successfully
                if (sentEvents.current.has(name)) {
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

        // Create the promise for this event
        const eventPromise = (async () => {
            try {
                pendingEvents.current.add(name)
                const result = await analytics(backendEvent)
                if (result.success) {
                    sentEvents.current.add(name)
                }
                return result
            } catch (error) {
                console.error('BRING: Error sending analytics event', error)
                return { success: false, error: error as Error }
            } finally {
                pendingEvents.current.delete(name)
                pendingPromises.current.delete(name)
            }
        })()

        // Store the promise
        pendingPromises.current.set(name, eventPromise)

        return eventPromise
    }, [flowId, platform, retailerName, testVariant, userId, walletAddress])

    useEffect(() => {
        if (ReactGA.isInitialized && measurementId) return;

        ReactGA.initialize(measurementId, {
            gaOptions: {
                storage: 'none',
                storeGac: false,
                cookieFlags: 'SameSite=None;Secure'
            },
            gtagOptions: {
                anonymize_ip: true,
                cookie_update: false,
                platform,
                testId: TEST_ID,
                testVariant,
                source: 'extension',
                walletAddress
            }
        });

    }, [measurementId, platform, testVariant, walletAddress]);

    useEffect(() => {
        if (window.origin.includes('localhost')) {
            return
        }

        if (effectRan.current) return

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

        effectRan.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendPageViewEvent = (): void => {

        if (window.origin.includes('localhost')) {
            return
        }
        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }
        ReactGA.send({
            hitType: 'pageview',
            page_location: window.location.href,
            page_path: window.location.pathname,
            page_title: document.title,
            retailer: retailerName
        });
    };

    const sendGaEvent = async (name: EventName, event: GAEvent, disableGA: boolean = false): Promise<void> => {
        if (window.origin.includes('localhost')) return

        const backendResult = await sendBackendEvent(name, event)

        // If the event was skipped (already sent) or failed, don't send to GA
        if (backendResult.skipped || !backendResult.success) return

        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }

        if (disableGA) return

        const params: { [key: string]: unknown } = {
            ...event,
            platform,
            testId: TEST_ID,
            testVariant,
            source: 'extension'
        }

        if (walletAddress) params.walletAddress = walletAddress
        ReactGA.event(name, params)
        return
    };

    return (
        <GoogleAnalyticsContext.Provider value={{ sendGaEvent, sendPageViewEvent }}>
            {children}
        </GoogleAnalyticsContext.Provider>
    );
};