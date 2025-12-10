import { Outlet, useLoaderData } from "react-router-dom"
import { GoogleAnalyticsProvider } from "../context/googleAnalyticsContext"
import WalletAddressProvider from "../context/walletAddressContext"
import { GA_MEASUREMENT_ID } from "../config"
import useCustomTheme from "../hooks/useCustomTheme"
import Beamer from "../components/Beamer/Beamer"

const Layout = () => {
    const data = useLoaderData() as LoaderData
    useCustomTheme()

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
                >
                    <Beamer enabled={data.beamer} />
                    <Outlet />
                </GoogleAnalyticsProvider>
            </WalletAddressProvider>
        </>
    )
}

export default Layout