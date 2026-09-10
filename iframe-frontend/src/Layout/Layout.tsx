import { Outlet, useLoaderData, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { wasWidgetExpanded } from "../utils/widgetSession"
import { AnalyticsProvider } from "../context/analyticsContext"
import { useAnalytics } from "../hooks/useAnalytics"
import WalletAddressProvider from "../context/walletAddressContext"
import Beamer from "../components/Beamer/Beamer"
import { sendMessage, ACTIONS } from "../utils/sendMessage"

const AutoCloseTimer = ({ timeout }: { timeout?: number }) => {
    const { sendAnalyticsEvent } = useAnalytics()

    useEffect(() => {
        if (typeof timeout !== 'number' || timeout <= 0) return
        const timer = setTimeout(async () => {
            await sendAnalyticsEvent('popup_close', {
                category: 'system',
                action: 'timeout',
                details: 'extension'
            })
            sendMessage({ action: ACTIONS.CLOSE })
        }, timeout)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
}

// Takes focus when the host page says it's safe (it checks its own caret - we can't, being
// cross-origin). Focusing the body routes Escape and Tab into this document; falling back to
// the first control if a browser refuses to focus the body.
const FocusOnOffer = () => {
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.data?.from !== 'bringweb3' || e.data?.action !== 'FOCUS_SURFACE') return
            document.body.tabIndex = -1
            document.body.focus()
            if (document.activeElement !== document.body) {
                document.querySelector<HTMLElement>('button')?.focus()
            }
        }

        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [])

    return null
}

const Layout = () => {
    const data = useLoaderData() as LoaderData
    const { pathname } = useLocation()
    // True when this page load starts as the collapsed widget badge (popup route,
    // widget enabled, not restored expanded from a previous page in this tab). Read
    // once on mount: expanding later writes 'true' to sessionStorage, and a re-render
    // must not flip this after the page_view already went out.
    const [pageViewIsWidget] = useState(() =>
        pathname === '/' && !!data.isWidgetEnabled && !wasWidgetExpanded(data.platformName)
    )

    return (
        <>
            <WalletAddressProvider address={data.walletAddress}>
                <AnalyticsProvider
                    retailerName={data.name}
                    userId={data.userId}
                    platform={data.platformName}
                    testVariants={data.testVariants}
                    location={data.url}
                    flowId={data.flowId}
                    searchEngineDomain={data.searchEngineDomain}
                    triggerType={data.triggerType}
                    offerBarSearch={data.offerBarSearch}
                    domain={data.domain}
                    inlineSearchLink={data.inlineSearchLink}
                    matchedKeyword={data.matchedKeyword}
                    isOfferBar={data.isOfferBar}
                    pageViewIsWidget={pageViewIsWidget}
                >
                    <Beamer enabled={data.beamer} />
                    <FocusOnOffer />
                    <AutoCloseTimer timeout={data.timeout} />
                    <Outlet />
                </AnalyticsProvider>
            </WalletAddressProvider>
        </>
    )
}

export default Layout