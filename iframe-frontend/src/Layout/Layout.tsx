import { Outlet, useLoaderData } from "react-router-dom"
import { useEffect } from "react"
import { GoogleAnalyticsProvider } from "../context/googleAnalyticsContext"
import WalletAddressProvider from "../context/walletAddressContext"
import { GA_MEASUREMENT_ID } from "../config"
import Beamer from "../components/Beamer/Beamer"
import useTimeout from "../hooks/useTimeout"
import { sendMessage, ACTIONS } from "../utils/sendMessage"

const Layout = () => {
    const data = useLoaderData() as LoaderData

    const { start: startAutoCloseTimer } = useTimeout({
        callback: () => sendMessage({ action: ACTIONS.CLOSE }),
        delay: data.timeout!
    })

    useEffect(() => {
        if (data.timeout && data.timeout > 0) startAutoCloseTimer()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                    <Outlet />
                </GoogleAnalyticsProvider>
            </WalletAddressProvider>
        </>
    )
}

export default Layout