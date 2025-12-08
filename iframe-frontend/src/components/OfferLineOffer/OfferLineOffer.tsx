import styles from './styles.module.css'
import { useCallback, useState } from 'react'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import OfferLineOptOut from '../OfferLineOptOut/OfferLineOptOut'
import activate from '../../api/activate'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useRouteLoaderData } from 'react-router-dom'
import toCaseString from '../../utils/toCaseString'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVATE_QUIET_TIME } from '../../config'
import parseTime from '../../utils/parseTime'
import { Oval } from 'react-loader-spinner'
import OfferLineLogos from '../OfferLineLogos/OfferLineLogos'
import OfferLineCloseBtn from '../OfferLineCloseBtn/OfferLineCloseBtn'

const OfferLineOffer = () => {
    const { sendGaEvent } = useGoogleAnalytics()
    const { walletAddress } = useWalletAddress()
    const {
        textMode,
        flowId,
        name,
        userId,
        platformName,
        retailerId,
        url,
        networkUrl,
        cryptoSymbols,
        isTester,
        version,
        domain,
        offerlineDomain,
        isOfferLine,
        offerlineSearch,
        searchTermPattern,
        offerText
    } = useRouteLoaderData('root') as LoaderData
    const [optOutOpen, setOptOutOpen] = useState(false)
    const [isDemo, setIsDemo] = useState(false)
    const [status, setStatus] = useState<'idle' | 'waiting' | 'activating' | 'done'>('idle')

    const activateAction = useCallback(async () => {
        setStatus('activating')

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

        if (isTester && isDemo) {
            body.isDemo = true
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

    }, [cryptoSymbols, domain, offerlineDomain, flowId, isDemo, isTester, name, platformName, retailerId, sendGaEvent, url, userId, version, walletAddress, networkUrl, isOfferLine, offerlineSearch, searchTermPattern])

    return (
        <>
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
                        <OfferLineLogos />
                        <div id="offerline-details-text" className={styles.details_txt}>
                            {offerText}
                        </div>
                        <div className={styles.actions_container}>
                            {walletAddress && isTester ?
                                <div className={styles.demo_container}>
                                    <input
                                        type='checkbox'
                                        id='isDemo'
                                        className={styles.demo_checkbox}
                                        checked={isDemo}
                                        onChange={e => setIsDemo(e.target.checked)}
                                        disabled={status !== 'idle'}
                                    />
                                    <label htmlFor='isDemo' className={styles.demo_label}>isDemo</label>
                                </div>
                                : null
                            }
                            <div className={styles.buttons}>
                                <button
                                    id="activate-btn"
                                    onClick={activateAction}
                                    className={styles.btn}
                                    disabled={status !== 'idle'}
                                >
                                    {status === 'idle' ?
                                        toCaseString("Activate", textMode)
                                        :
                                        <Oval
                                            visible={true}
                                            height="20"
                                            width="20"
                                            strokeWidth="4"
                                            strokeWidthSecondary="4"
                                            color="var(--primary-btn-f-c)"
                                            secondaryColor=""
                                            ariaLabel="oval-loading"
                                        />
                                    }
                                </button>

                                <button
                                    id="opt-out-btn"
                                    className={styles.action_btn}
                                    disabled={status !== 'idle'}
                                    onClick={() => setOptOutOpen(true)}
                                >
                                    {toCaseString("Pause Cashback", textMode)}
                                </button>
                            </div>
                            <OfferLineCloseBtn />
                        </div>
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
        </>
    )
}

export default OfferLineOffer
