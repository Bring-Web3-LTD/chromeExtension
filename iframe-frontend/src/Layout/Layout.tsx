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
                    testVariant={data.variant}
                    location={data.url}
                    flowId={data.flowId}
                    searchEngineDomain={data.searchEngineDomain}
                    verifiedMatch={data.verifiedMatch}
                    offerBarSearch={data.offerBarSearch}
                    domain={data.domain}
                    inlineSearchLink={data.inlineSearchLink}
                    matchedKeyword={data.matchedKeyword}
                    isOfferBar={data.isOfferBar}
                    pageViewIsWidget={pageViewIsWidget}
                >
                    <Beamer enabled={data.beamer} />
                    <AutoCloseTimer timeout={data.timeout} />
                    <Outlet />
                </AnalyticsProvider>
            </WalletAddressProvider>
        </>
    )
}

export default Layout