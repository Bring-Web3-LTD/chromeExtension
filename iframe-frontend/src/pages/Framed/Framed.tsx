import { useEffect, useState, useCallback } from "react"
import { sendMessage, ACTIONS } from "../../utils/sendMessage"
import { getIframeStyle } from "../../utils/iframeStyles"
import { useRouteLoaderData } from "react-router-dom"
import PlatformLogo from "../../components/PlatformLogo/PlatformLogo"
import toCapital from "../../utils/toCapital"
import formatCashback from "../../utils/formatCashback"
import parseTime from "../../utils/parseTime"
import activate from "../../api/activate"
import { useGoogleAnalytics } from "../../hooks/useGoogleAnalytics"
import { useWalletAddress } from "../../hooks/useWalletAddress"
import { useActivationPayload } from "../../hooks/useActivationPayload"
import { OB_ACTIVATE_QUIET_TIME } from "../../config"
import Optout from "./Optout/Optout"
import { getInitials } from "../../utils/getInitials"
import parseOfferText from "../../utils/parseOfferText"
import styles from "./styles.module.css"

const THIRTY_MIN_MS = 30 * 60 * 1000

const Framed = () => {
    const {
        platformName,
        domain,
        cryptoSymbols,
        maxCashback,
        cashbackSymbol,
        cashbackCurrency,
        version,
        flowId,
        name,
        displayName,
        userId,
        retailerId,
        url,
        searchEngineDomain,
        offerBarSearch,
        networkUrl,
        isOfferBar,
        searchTermPattern,
        isRegex,
        iconUrl,
        offerTextTb,
        iframeStyle: themeIframeStyle
    } = useRouteLoaderData('root') as LoaderData

    const [showOptout, setShowOptout] = useState(false)
    const [isOptedOut, setIsOptedOut] = useState(false)
    const [status, setStatus] = useState<'idle' | 'activating' | 'done'>('idle')
    const { sendGaEvent } = useGoogleAnalytics()
    const { walletAddress } = useWalletAddress()
    const activationPayload = useActivationPayload()
    const [fallbackLogo, setFallbackLogo] = useState<string | null>(
        !iconUrl || iconUrl.trim() === '' ? getInitials(name) : null
    )

    const close = async () => {
        await sendGaEvent('popup_close', {
            category: 'user_action',
            action: 'click',
            details: 'extension'
        })
        if (isOptedOut) {
            sendMessage({ action: ACTIONS.CLOSE })
        } else {
            sendMessage({ action: ACTIONS.CLOSE, domain: ['google.com'], time: parseTime(THIRTY_MIN_MS, version), type: ['kdsi'], isRegex: [false] })
        }
    }

    const handleActivate = useCallback(async () => {
        setStatus('activating')

        const body: Parameters<typeof activate>[0] = {
            walletAddress,
            platformName,
            retailerId,
            url: networkUrl,
            domain,
            userId,
            tokenSymbol: cryptoSymbols[0],
            flowId,
            isOfferBar,
            networkUrl,
            searchEngineDomain,
            offerBarPageUrl: url,
            offerBarSearch,
            activationPayload
        }

        const { status, url: redirectUrl, iframeUrl, token } = await activate(body)

        if (status !== 200) {
            setStatus('idle')
            return
        }

        sendMessage({
            action: ACTIONS.ACTIVATE,
            url,
            domain,
            searchTermPattern,
            time: parseTime(OB_ACTIVATE_QUIET_TIME, version),
            redirectUrl,
            iframeUrl,
            token,
            flowId,
            platformName,
            quietDomainType: 'kds',
            isRegex
        })

        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name
        })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activationPayload, cryptoSymbols, domain, searchEngineDomain, flowId, name, displayName, platformName, retailerId, sendGaEvent, url, userId, version, walletAddress, networkUrl, isOfferBar, offerBarSearch, searchTermPattern])

    useEffect(() => {
        sendMessage({ action: ACTIONS.OPEN, style: getIframeStyle('offerbarFramed', platformName, themeIframeStyle) })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={`${styles.frameContainer} framed-transparent`}>
            {/* Top bar — fixed 71px strip at top of viewport */}
            <div id="tb-container" className={styles.tbBar}>
                {showOptout ? (
                    <Optout 
                        closeFn={() => setShowOptout(false)} 
                        onOptOut={() => setIsOptedOut(true)} 
                        onConfirmClose={close}
                    />
                ) : (
                    /* Inner wrapper — horizontal layout with padding */
                    <div id="tb-inner" className={styles.tbInner}>
                        {/* Left + center content (logos, names, offer text) */}
                        <div id="tb-left-center" className={styles.tbLeftCenter}>

                            {/* logos + names */}
                            <div id="tb-logos-names" className={styles.tbLogosNames}>
                                {/* Logos row — this is the layout anchor */}
                                <div id="tb-logos-row" className={styles.tbLogosRow}>
                                    <div id="tb-platform-logo" className={styles.tbPlatformLogo}>
                                        <PlatformLogo size='tb' platformName={platformName} />
                                        <span id="tb-platform-name" className={styles.tbPlatformName}>
                                            {toCapital(platformName)}
                                        </span>
                                    </div>
                                    <span id="tb-plus" className={styles.tbPlus}>+</span>
                                    <div id="tb-retailer-logo" className={styles.tbRetailerLogo}>
                                        {fallbackLogo ? (
                                            <span id="tb-retailer-initials" className={styles.tbRetailerInitials}>
                                                {fallbackLogo}
                                            </span>
                                        ) : (
                                            <img
                                                id="tb-retailer-logo-img"
                                                src={iconUrl}
                                                className={styles.tbRetailerImg}
                                                alt="retailer-logo"
                                                onError={() => setFallbackLogo(getInitials(name))}
                                            />
                                        )}
                                        <span
                                            id="tb-retailer-name"
                                            className={`${styles.tbRetailerName}${displayName === displayName.toUpperCase() ? ` ${styles.tbRetailerNameUppercase}` : ''}`}
                                        >
                                            {displayName}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cashback offer text — centered, truncated */}
                            <div id="tb-offer-text" className={styles.tbOfferText}>
                                <span>
                                    {parseOfferText(offerTextTb) || (
                                        <>Up to {formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency)} {cryptoSymbols[0]} cashback when purchasing with any card</>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Right side — Activate, Stop Offers, Close buttons */}
                        <div id="tb-buttons" className={styles.tbButtons}>
                            <button
                                id="tb-activate-btn"
                                className={styles.tbActivateBtn}
                                onClick={handleActivate}
                                disabled={status !== 'idle'}
                            >
                                ACTIVATE
                            </button>
                            <button
                                id="tb-opt-out-btn"
                                className={styles.tbOptOutBtn}
                                onClick={() => setShowOptout(true)}
                            >
                                Stop<br />Offers
                            </button>
                            {/* Close (X) button */}
                            <button id="tb-close-btn" className={styles.tbCloseBtn} onClick={close}>
                                <img src={`${import.meta.env.BASE_URL}icons/tb-close.svg`} alt="Close" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Framed