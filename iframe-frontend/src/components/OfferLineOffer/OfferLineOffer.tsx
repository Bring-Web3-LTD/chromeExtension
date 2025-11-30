import styles from './styles.module.css'
import { useCallback, useEffect, useState } from 'react'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import OfferLineOptOut from '../OfferLineOptOut'
import activate from '../../api/activate'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVATE_QUIET_TIME } from '../../config'
import parseTime from '../../utils/parseTime'
import { Oval } from 'react-loader-spinner'

interface BringEventData {
    from: string;
    action: string;
    walletAddress: WalletAddress;
}

const OfferLineOffer = () => {
    const { sendGaEvent } = useGoogleAnalytics()
    const { walletAddress, setWalletAddress } = useWalletAddress()
    const {
        flowId,
        name,
        userId,
        platformName,
        retailerId,
        url,
        cryptoSymbols,
        isTester,
        version,
        domain,
        offerlineDomain,
        offerText,
        networkUrl,
        isOfferLine,
        offerlineSearch
    } = useRouteLoaderData('root') as LoaderData
    const [optOutOpen, setOptOutOpen] = useState(false)
    const [isDemo, setIsDemo] = useState(false)
    const [status, setStatus] = useState<'idle' | 'waiting' | 'activating' | 'done'>('idle')

    const activateAction = useCallback(async () => {
        setStatus('activating')

        console.log('[OfferLineOffer] isOfferLine value:', isOfferLine)

        const body: Parameters<typeof activate>[0] = {
            walletAddress,
            platformName,
            retailerId,
            url: networkUrl,
            userId,
            tokenSymbol: cryptoSymbols[0],
            flowId,
            isOfferLine,
            networkUrl,
            offerlineDomain,
            offerlinePageUrl: url,
            offerlineSearch
        }

        if (isTester && isDemo) body.isDemo = true
        
        console.log('[OfferLineOffer] activate body:', JSON.stringify(body, null, 2))

        const { status, url: redirectUrl, iframeUrl, token } = await activate(body)

        if (status !== 200) {
            setStatus('idle')
            return
        }

        sendMessage({
            action: ACTIONS.ACTIVATE,
            url,
            domain,
            time: parseTime(ACTIVATE_QUIET_TIME, version),
            redirectUrl,
            iframeUrl,
            token,
            flowId,
            platformName
        })

        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name
        })

    }, [cryptoSymbols, domain, offerlineDomain, flowId, isDemo, isTester, name, platformName, retailerId, sendGaEvent, url, userId, version, walletAddress, networkUrl, isOfferLine, offerlineSearch])

    useEffect(() => {
        if (status === 'done') return

        const walletAddressUpdate = (e: MessageEvent<BringEventData>) => {
            const { walletAddress, action } = e.data
            if (action !== 'WALLET_ADDRESS_UPDATE') return
            setWalletAddress(walletAddress)
        }

        window.addEventListener("message", walletAddressUpdate)

        return () => {
            window.removeEventListener("message", walletAddressUpdate)
        }
    }, [setWalletAddress, status])

    return (
        <AnimatePresence>
            {!optOutOpen ? (
                <motion.div
                    id="offerline-container"
                    key="main"
                    className={styles.container}
                    initial={{ x: 0, opacity: 1 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ duration: .2, ease: "easeInOut" }}
                >
                    {/* Offer Text from Server */}
                    {offerText && (
                        <div id="offerline-text" className={styles.offer_text}>
                            {offerText}
                        </div>
                    )}

                    {/* Demo Checkbox for Testers */}
                    {walletAddress && isTester && (
                        <div id="demo-container" className={styles.demo_container}>
                            <input
                                className={styles.demo_checkbox}
                                type="checkbox"
                                id='demo'
                                onChange={(e) => setIsDemo(e.target.checked)}
                            />
                            <label id="demo-label" className={styles.demo_label} htmlFor="demo">Demo</label>
                        </div>
                    )}

                    {/* Activate Button */}
                    <button
                        id="activate-btn"
                        onClick={activateAction}
                        className={styles.activate_btn}
                        disabled={status !== 'idle'}
                    >
                        {status === 'idle' ? (
                            'Activate'
                        ) : (
                            <Oval
                                visible={true}
                                height="20"
                                width="20"
                                strokeWidth="4"
                                strokeWidthSecondary="4"
                                color="white"
                                secondaryColor=""
                                ariaLabel="oval-loading"
                            />
                        )}
                    </button>

                    {/* Opt Out Button */}
                    <button
                        id="opt-out-btn"
                        className={styles.opt_out_btn}
                        disabled={status !== 'idle'}
                        onClick={() => setOptOutOpen(true)}
                    >
                        Opt out
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    id="opt-out-motion-container"
                    key="optout"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ duration: .2, ease: "easeInOut" }}
                    className={styles.container}
                >
                    <OfferLineOptOut onClose={() => setOptOutOpen(false)} />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default OfferLineOffer
