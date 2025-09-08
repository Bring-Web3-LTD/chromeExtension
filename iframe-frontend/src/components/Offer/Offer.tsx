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
import formatCashback from '../../utils/formatCashback'
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
        maxCashback,
        cashbackSymbol,
        cashbackCurrency
    } = useRouteLoaderData('root') as LoaderData
    const [optOutOpen, setOptOutOpen] = useState(false)
    const [isDemo, setIsDemo] = useState(false)
    const [status, setStatus] = useState<'idle' | 'waiting' | 'switch' | 'activating' | 'done'>('idle')

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
                            key="main"
                            className={styles.container}
                            initial={{ x: 0, opacity: 1 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ duration: .2, ease: "easeInOut" }}
                        >
                            <div className={styles.top_container}>
                                {walletAddress ?
                                    <div className={styles.wallet_container}>
                                        <span className={styles.wallet} >{splitWordMaxFive(walletAddress)}</span>
                                    </div>
                                    :
                                    <button
                                        className={`${styles.wallet_container} ${styles.wallet} ${styles.connect_btn}`}
                                        onClick={() => sendMessage({ action: ACTIONS.PROMPT_LOGIN })}
                                    >
                                        Connect wallet
                                    </button>
                                }
                                <SwitchBtn
                                    callback={() => setStatus('switch')}
                                />
                                {walletAddress && isTester ?
                                    <div className={styles.demo_container}>
                                        <input
                                            className={styles.demo_checkbox}
                                            type="checkbox"
                                            id='demo'
                                            onChange={(e) => setIsDemo(e.target.checked)}
                                        />
                                        <label className={styles.demo_label} htmlFor="demo">Demo</label>
                                    </div> : null
                                }
                            </div>
                            <div className={styles.details}>
                                <CollaborationLogos />
                                <div className={styles.details_txt} >
                                    Buy with any card and earn up to <span className={styles.cashback_amount}>{formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency)}</span> in {cryptoSymbols[0]}
                                </div>
                            </div>
                            <div className={styles.action_container}>
                                <button
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
                                <div className={styles.btns_container}>
                                    <button
                                        className={styles.action_btn}
                                        disabled={status !== 'idle'}
                                        onClick={() => setOptOutOpen(true)}
                                    >
                                        {toCaseString("Opt out", textMode)}
                                    </button>
                                    <button
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
                                        {toCaseString("Cancel", textMode)}
                                    </button>
                                </div>
                                <div className={styles.clarify}>No extra steps required - just shop and get {cryptoSymbols[0]}</div>
                            </div>
                        </motion.div>
                        :
                        <motion.div
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