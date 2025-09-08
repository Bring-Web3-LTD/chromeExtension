// Styles
import styles from './style.module.css'
// Hooks
import { useEffect, useState } from "react"
import { useRouteLoaderData } from "react-router-dom"
import { useGoogleAnalytics } from "../../../hooks/useGoogleAnalytics"
import { motion, AnimatePresence } from "framer-motion"
// Components
import CloseBtn from "../CloseBtn/CloseBtn"
import Markdown from "react-markdown"
import TimePeriodSelector from "../../../components/TimePeriodSelector/TimePeriodSelector"
import { Oval } from 'react-loader-spinner'
// Functions
import activate from "../../../api/activate"
import formatCashback from "../../../utils/formatCashback"
import splitStringWithDots from "../../../utils/splitStringWithDots"
import { sendMessage, ACTIONS } from "../../../utils/sendMessage"
import { ACTIVATE_QUIET_TIME } from "../../../config"
import parseTime from '../../../utils/parseTime'


const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0
    })
}



const OneStep = () => {
    const { iconsPath, cashbackSymbol, maxCashback, cashbackCurrency, cryptoSymbols, walletAddress, platformName, retailerId, name, url, flowId, domain, isTester, version, topGeneralTermsUrl, retailerTermsUrl, generalTermsUrl, userId } = useRouteLoaderData('root') as LoaderData
    const [[isShowingTerms, direction], setIsShowingTerms] = useState([false, 0])
    const [markdownContent, setMarkdownContent] = useState('')
    const [isShowingTurnoff, setIsShowingTurnoff] = useState(false)
    const tokenSymbol = cryptoSymbols[0]
    const [status, setStatus] = useState<'idle' | 'waiting' | 'activating' | 'done'>('idle')
    const [optoutPeriod, setOptoutPeriod] = useState<number | null>(null)
    const [isOptedOut, setIsOptedOut] = useState(false)
    const [isDemo, setIsDemo] = useState(false)
    const { sendGaEvent } = useGoogleAnalytics()

    useEffect(() => {
        const controller = new AbortController()

        const loadAllMarkdown = async () => {
            try {
                const [topGeneral, retailer, general] = await Promise.all([
                    fetch(topGeneralTermsUrl, { signal: controller.signal }).then(res => res.text()),
                    fetch(retailerTermsUrl, { signal: controller.signal }).then(res => res.text()),
                    fetch(generalTermsUrl, { signal: controller.signal }).then(res => res.text())
                ])

                setMarkdownContent(topGeneral + retailer + general)
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error("Error fetching markdown:", error)
                }
            }
        }

        loadAllMarkdown()

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const activateHandler = async () => {
        if (!walletAddress) {
            setStatus('waiting')
            sendMessage({ action: ACTIONS.PROMPT_LOGIN })
            return
        }

        setStatus('activating')

        sendGaEvent('retailer_activation', {
            category: 'user_action',
            action: 'click',
            process: 'activate',
            details: name
        })

        const body: Parameters<typeof activate>[0] = {
            walletAddress,
            platformName,
            retailerId,
            url,
            tokenSymbol,
            flowId,
            userId
        }

        if (isTester && isDemo) {
            body.isDemo = true
        }

        const { status, url: redirectUrl } = await activate(body)

        if (status !== 200) {
            setStatus('idle')
            return
        }

        sendMessage({ action: ACTIONS.ACTIVATE, url, domain, time: parseTime(ACTIVATE_QUIET_TIME, version), redirectUrl })
        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name
        })

    }

    const paginate = (newDirection: number) => {
        setIsShowingTerms([!isShowingTerms, newDirection])
    }

    const optoutSpecificDomain = async () => {
        if (!optoutPeriod) return
        sendMessage({ action: ACTIONS.OPT_OUT_SPECIFIC, domain, time: optoutPeriod })
        setIsOptedOut(true)
    }

    const closePopup = () => {
        sendMessage({ action: ACTIONS.CLOSE, domain })
    }

    return (
        <>
            <AnimatePresence initial={false} custom={direction} mode="wait">
                {!isShowingTerms ? (
                    <motion.div
                        key="main"
                        className={styles.container}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30, duration: 0.1 },
                            opacity: { duration: 0.2 }
                        }}
                    >
                        <div className={styles.addressContainer}>
                            {walletAddress ?
                                <div className={styles.address}>
                                    {splitStringWithDots(walletAddress, 7, 5)}
                                </div>
                                : null}
                        </div>
                        {
                            isTester ?
                                <label className={styles.test_label}>
                                    <span>Demo Store</span>
                                    <input
                                        className={styles.test_checkbox}
                                        type="checkbox"
                                        checked={isDemo}
                                        onChange={e => setIsDemo(e.target.checked)}
                                    />
                                </label>
                                : null
                        }
                        <CloseBtn />
                        <div className={styles.spacer}>
                        </div>
                        <img src={`${iconsPath}/coins.svg`} alt="coins" />
                        <h1 className={styles.title}>Activate Shop to Earn here</h1>
                        <h2 className={styles.subtitle}>Get up to {formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency)} back in {tokenSymbol} when you shop at {name}.</h2>
                        <button
                            className={styles.termsBtn}
                            onClick={() => paginate(1)}
                        >
                            <img src={`${iconsPath}/info.svg`} alt="info icon" />
                            Cashback terms
                        </button>
                        <div className={styles.clarify}>You’ll get a reward notification within 48 hours. {tokenSymbol} arrives after the return period ends.</div>
                        <div className={styles.btns}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={() => setIsShowingTurnoff(true)}
                            >
                                Turn off
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={activateHandler}
                                disabled={status !== 'idle'}
                            >
                                {status === 'idle' ?
                                    'Activate'
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
                        </div>
                        <div className={styles.agree}>
                            By activating, I accept the <span className={styles.terms} onClick={() => sendMessage({ action: ACTIONS.OPEN_CASHBACK_PAGE, url: 'https://www.argent.xyz/legal/privacy/argent-x' })}>legal terms.</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="terms"
                        className={styles.container}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30, duration: 0.1 },
                            opacity: { duration: 0.2 }
                        }}
                    >
                        <button
                            className={styles.backBtn}
                            onClick={() => paginate(-1)}
                        >
                            <img src={`${iconsPath}/arrow-left.svg`} alt="arrow left" />
                        </button>
                        <h1 className={styles.termsHeader}>Cashback terms:</h1>
                        <Markdown className={styles.markdown}>
                            {markdownContent}
                        </Markdown>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isShowingTurnoff ?
                    <motion.div
                        className={styles.overlay}
                        onClick={() => {
                            isOptedOut ?
                                closePopup() :
                                setIsShowingTurnoff(false)
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className={styles.turnoffContainer}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            exit={{ y: 50 }}
                            transition={{ duration: 0.2 }}
                        >
                            {!isOptedOut ?
                                <>
                                    <button
                                        className={styles.turnoffCloseBtn}
                                        onClick={() => setIsShowingTurnoff(false)}
                                    >
                                        <img src={`${iconsPath}/popup-x-mark.svg`} alt="x-mark icon" />
                                    </button>
                                    <img src={`${iconsPath}/turnoff.svg`} alt="turnoff icon" />

                                    <div className={styles.turnoffText}>Turn off offer for this store</div>
                                    <TimePeriodSelector
                                        onChange={(_, timestamp) => setOptoutPeriod(timestamp)}
                                    />
                                    <div className={`${styles.btns} ${styles.turnoffBtns}`}>
                                        <button
                                            className={`${styles.secondaryBtn} ${styles.turnoffBtn}`}
                                            onClick={() => setIsShowingTurnoff(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`${styles.primaryBtn} ${styles.turnoffBtn} ${optoutPeriod === null ? styles.primaryDisabled : ''}`}
                                            onClick={optoutSpecificDomain}
                                            disabled={optoutPeriod === null}
                                        >Confirm</button>
                                    </div>
                                </>
                                :
                                <>
                                    <div className={`${styles.turnoffText}`}>
                                        Offer turned off for this store
                                    </div>
                                    <div className={styles.turnoffDetails}>
                                        Shop to Earn is now turned off for this website. To turn it off on all websites, please go to Settings.
                                    </div>
                                    <button
                                        className={`${styles.secondaryBtn} ${styles.turnOffCloseBtn}`}
                                        onClick={closePopup}
                                    >Close</button>
                                </>
                            }
                        </motion.div>
                    </motion.div>
                    :
                    null}
            </AnimatePresence >
        </>
    )
}

export default OneStep