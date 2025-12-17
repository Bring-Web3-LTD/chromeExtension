import styles from './styles.module.css'
import { useCallback, useEffect, useState } from 'react'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import OptOut from '../OptOut/OptOut'
import activate from '../../api/activate'
import CloseBtn from '../CloseBtn/CloseBtn'
import SwitchBtn from '../SwitchBtn/SwitchBtn'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import splitWordMaxFive from '../../utils/splitWordMaxFive'
import { useRouteLoaderData } from 'react-router-dom'
import toCaseString from '../../utils/toCaseString'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVATE_QUIET_TIME } from '../../config'
import parseTime from '../../utils/parseTime'
import { Oval } from 'react-loader-spinner'
import CollaborationLogos from '../CollaborationLogos/CollaborationLogos'

interface BringEventData {
    from: string;
    action: string;
    walletAddress: WalletAddress;
}

interface Props {
    closeFn: () => void;
}

const Offer = ({ closeFn }: Props) => {
    const { sendGaEvent } = useGoogleAnalytics()
    const { walletAddress, setWalletAddress } = useWalletAddress()
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
        variant,
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
            url,
            userId,
            tokenSymbol: cryptoSymbols[0],
            flowId,
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
            platformName
        })

        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name
        })

    }, [cryptoSymbols, domain, flowId, isDemo, isTester, name, platformName, retailerId, sendGaEvent, url, userId, version, walletAddress])


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
            <CloseBtn />
            <AnimatePresence>
                {
                    !optOutOpen ?
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
                                    {offerText}
                                </div>
                            </div>
                            <div id="offer-action-container" className={styles.action_container}>
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

                                <div
                                    id="offer-action-btns-container"
                                    className={styles.btns_container}
                                    style={variant === 'testB' ?{
                                        justifyContent: 'center'
                                    }:{}}
                                >
                                    <button
                                        id="opt-out-btn"
                                        className={styles.action_btn}
                                        disabled={status !== 'idle'}
                                        onClick={() => setOptOutOpen(true)}
                                        style={variant === 'testB' ? {
                                            borderColor:'transparent',
                                            textDecoration: 'underline',
                                            color:'white',
                                            width:'auto'
                                        } : {}}
                                    >
                                        {toCaseString("Pause Cashback", textMode)}
                                    </button>
                                    {variant !== 'testB' ?
                                        <button
                                            id="cancel-btn"
                                            className={styles.action_btn}
                                            disabled={status !== 'idle'}
                                            onClick={async () => {
                                                await sendGaEvent('popup_close', {
                                                    category: 'user_action',
                                                    action: 'click',
                                                    details: 'extension'
                                                })
                                                closeFn()
                                            }}
                                        >
                                            {variant === 'testA' ? toCaseString("Close", textMode) : toCaseString("Cancel", textMode)}
                                        </button> : null}
                                </div>

                                <div id="offer-clarify-text" className={styles.clarify}>No extra steps required - just shop and get {cryptoSymbols[0]}</div>
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
                            />
                        </motion.div>
                }
            </AnimatePresence>
        </>
    )
}

export default Offer