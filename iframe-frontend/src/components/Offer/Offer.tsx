import styles from './styles.module.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useVariant } from '../../hooks/useVariant'
import OptOut from '../OptOut/OptOut'
import activate from '../../api/activate'
import CloseBtn from '../CloseBtn/CloseBtn'
import SwitchBtn from '../SwitchBtn/SwitchBtn'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import splitWordMaxFive from '../../utils/splitWordMaxFive'
import { useRouteLoaderData } from 'react-router-dom'
import toCaseString from '../../utils/toCaseString'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useActivationPayload } from '../../hooks/useActivationPayload'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVATE_QUIET_TIME } from '../../config'
import parseTime from '../../utils/parseTime'
import { Oval } from 'react-loader-spinner'
import CollaborationLogos from '../CollaborationLogos/CollaborationLogos'
import formatCashback from '../../utils/formatCashback'
import parseOfferText from '../../utils/parseOfferText'
import OfferTerms from '../OfferTerms/OfferTerms'

interface BringEventData {
    from: string;
    action: string;
    walletAddress: WalletAddress;
}

interface Props {
    closeFn: () => void;
    /**
     * Collapsed-widget mode only: when provided, the X and CloseBtn collapse the AB
     * back to the badge instead of closing + suppressing the domain. All other
     * actions (Activate / Pause Cashback) keep standard AB behavior.
     */
    onCollapse?: () => void;
}

const Offer = ({ closeFn, onCollapse }: Props) => {
    const { sendAnalyticsEvent } = useAnalytics()
    // AB tests: activate + opt-out button colours (variantA/variantB per registry).
    // Users not in a test resolve to 'control' → no variant class.
    const activateBtnVariant = useVariant('activate-btn-color')
    const optOutBtnVariant = useVariant('optOut-btn-color')
    const { walletAddress, setWalletAddress } = useWalletAddress()
    const activationPayload = useActivationPayload()
    const {
        textMode,
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
        maxCashback,
        cashbackSymbol,
        cashbackCurrency,
        followups,
        offerText,
        isOfferBar
    } = useRouteLoaderData('root') as LoaderData

    const defaultOfferText = useMemo(() => {
        const formattedCashback = formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency)
        const cryptoSymbol = cryptoSymbols[0]
        return `Earn up to <#${formattedCashback}#> in ${cryptoSymbol}`
    }, [cryptoSymbols, maxCashback, cashbackCurrency, cashbackSymbol])

    const [optOutOpen, setOptOutOpen] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [isOpted, setIsOpted] = useState(false)
    const [isDemo, setIsDemo] = useState(false)
    const [status, setStatus] = useState<'idle' | 'waiting' | 'activating' | 'done'>('idle')
    

    const activateAction = useCallback(async () => {
        setStatus('activating')

        const body: Parameters<typeof activate>[0] = {
            walletAddress,
            platformName,
            retailerId,
            url,
            domain,
            userId,
            tokenSymbol: cryptoSymbols[0],
            flowId,
            isOfferBar,
            activationPayload,
        }

        if (isTester && isDemo) body.isDemo = true

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
            platformName,
            quietDomainType: 'kds',
            followups
        })

        sendAnalyticsEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name
        })

    }, [activationPayload, cryptoSymbols, domain, flowId, isDemo, isTester, name, platformName, retailerId, sendAnalyticsEvent, url, userId, version, walletAddress])


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
        <>
            <CloseBtn withTime={!isOpted && !showTerms} overrideClose={onCollapse} />
            <AnimatePresence>
                {
                    showTerms ?
                        <motion.div
                            id="offer-terms-container"
                            key="terms"
                            className={styles.container}
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ duration: .2, ease: "easeInOut" }}
                        >
                            <OfferTerms onBack={() => setShowTerms(false)} />
                        </motion.div>
                        : !optOutOpen ?
                        <motion.div
                            id="offer-container"
                            key="main"
                            className={styles.container}
                            initial={{ x: 0, opacity: 1 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ duration: .2, ease: "easeInOut" }}
                        >
                            <div id="offer-top-container" className={styles.top_container}>
                                {walletAddress ?
                                    <div id="wallet-display-container" className={styles.wallet_container}>
                                        <span id="wallet-address" className={styles.wallet} >{splitWordMaxFive(walletAddress)}</span>
                                    </div>
                                    :
                                    <button
                                        id="connect-wallet-btn"
                                        className={`${styles.wallet_container} ${styles.wallet} ${styles.connect_btn}`}
                                        onClick={() => sendMessage({ action: ACTIONS.PROMPT_LOGIN })}
                                    >
                                        Connect wallet
                                    </button>
                                }
                                <SwitchBtn
                                />
                                {walletAddress && isTester ?
                                    <div id="demo-container" className={styles.demo_container}>
                                        <input
                                            className={styles.demo_checkbox}
                                            type="checkbox"
                                            id='demo'
                                            onChange={(e) => setIsDemo(e.target.checked)}
                                        />
                                        <label id="demo-label" className={styles.demo_label} htmlFor="demo">Demo</label>
                                    </div> : null
                                }
                            </div>
                            <div id="offer-details" className={styles.details}>
                                <CollaborationLogos />
                                <div id="offer-details-text" className={styles.details_txt} >
                                    {parseOfferText(offerText || defaultOfferText)}
                                </div>
                            </div>
                            <div id="offer-action-container" className={styles.action_container}>
                                <button
                                    id="activate-btn"
                                    onClick={activateAction}
                                    className={`${styles.btn} ${activateBtnVariant === 'variantA' ? styles.btn_variantA : activateBtnVariant === 'variantB' ? styles.btn_variantB : ''}`}
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
                                            color="var(--primary-btn-processing-f-c, var(--primary-btn-f-c))"
                                            secondaryColor=""
                                            ariaLabel="oval-loading"
                                        />
                                    }
                                </button>

                                <div
                                    id="offer-action-btns-container"
                                    className={styles.btns_container}
                                >
                                    <button
                                        id="opt-out-btn"
                                        className={`${styles.action_btn} ${optOutBtnVariant === 'variantA' ? styles.optout_variantA : optOutBtnVariant === 'variantB' ? styles.optout_variantB : ''}`}
                                        disabled={status !== 'idle'}
                                        onClick={() => setOptOutOpen(true)}
                                    >
                                        {toCaseString("Pause Cashback", textMode)}
                                    </button>
                                    <button
                                        id="cancel-btn"
                                        className={styles.action_btn}
                                        disabled={status !== 'idle'}
                                        onClick={async () => {
                                            await sendAnalyticsEvent('popup_close', {
                                                category: 'user_action',
                                                action: 'click',
                                                details: 'extension'
                                            })
                                            // Widget mode: analytics still fire above; collapse back to the
                                            // badge instead of closing + writing to quietDomains.
                                            if (onCollapse) {
                                                onCollapse()
                                                return
                                            }
                                            closeFn()
                                        }}
                                    >
                                        {toCaseString("Close", textMode)}
                                    </button>
                                </div>

                            </div>
                            <div id="offer-agree-text" className={styles.agree}>
                                By activating, you agree to the <span id="offer-terms-link" className={styles.terms} onClick={() => setShowTerms(true)}>Terms</span>
                            </div>
                        </motion.div>
                        :
                        <motion.div
                            id="opt-out-motion-container"
                            key="optout"
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ duration: .2, ease: "easeInOut" }}
                            className={styles.container}
                        >
                            <OptOut
                                onClose={() => setOptOutOpen(false)}
                                onOpted={() => setIsOpted(true)}
                            />
                        </motion.div>
                }
            </AnimatePresence>
        </>
    )
}

export default Offer