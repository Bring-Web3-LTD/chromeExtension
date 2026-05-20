import { Outlet, useLoaderData } from "react-router-dom"
import { useEffect } from "react"
import { GoogleAnalyticsProvider } from "../context/googleAnalyticsContext"
import { useGoogleAnalytics } from "../hooks/useGoogleAnalytics"
import WalletAddressProvider from "../context/walletAddressContext"
import { GA_MEASUREMENT_ID } from "../config"
import Beamer from "../components/Beamer/Beamer"
import { sendMessage, ACTIONS } from "../utils/sendMessage"

const AutoCloseTimer = ({ timeout }: { timeout?: number }) => {
    const { sendGaEvent } = useGoogleAnalytics()

    useEffect(() => {
        if (typeof timeout !== 'number' || timeout <= 0) return
        const timer = setTimeout(async () => {
            await sendGaEvent('popup_close', {
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

    return (
        <>
            <WalletAddressProvider address={data.walletAddress}>
                <GoogleAnalyticsProvider
                    retailerName={data.name}
                    userId={data.userId}
                    measurementId={GA_MEASUREMENT_ID}
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
                >
                    <Beamer enabled={data.beamer} />
                    <AutoCloseTimer timeout={data.timeout} />
                    <Outlet />
                </GoogleAnalyticsProvider>
            </WalletAddressProvider>
        </>
    )
}

export default Layout