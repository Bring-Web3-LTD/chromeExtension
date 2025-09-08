import { useRouteLoaderData } from 'react-router-dom'
import styles from './styles.module.css'
import PlatformLogo from "../../components/PlatformLogo/PlatformLogo"
import CloseBtn from '../../components/CloseBtn/CloseBtn'
import { useEffect } from 'react'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { notificationIframeStyle } from '../../utils/iframeStyles'
import toCaseString from '../../utils/toCaseString'
import useTimeout from '../../hooks/useTimeout'
import { useWalletAddress } from '../../hooks/useWalletAddress'

const formatDate = (str: number): string => {
    const date = new Date(str);
    const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    return formatted
}

interface Reward {
    [key: string]: number
}

interface NotificationTextProps {
    new: Reward | null
    total: Reward | null
    claimable: Reward | null
    expiredAt: number | null
    minWidth?: string
}

const parseObj = (obj: { [key: string]: number } | null) => {
    if (!obj) return obj

    return Object.entries(obj).map(([key, value]) => ({ symbol: key, amount: value }))[0]
}

const NotificationText = (props: NotificationTextProps) => {
    const _new = parseObj(props.new)
    const _total = parseObj(props.total)
    const _claimable = parseObj(props.claimable)

    const isJustNew = !_claimable && !_total
    const isJustClaimable = !_new && !_total

    return (
        <div className={styles.text_container} style={props.minWidth ? { minWidth: props.minWidth } : {}}>
            <div className={`${styles.notification_details} ${styles.no_wallet_notification_details}`}>
                {_new ?
                    <div>
                        Just earned:{isJustNew ? <br /> : ' '}<span className={`${isJustNew ? styles.bold : ''}`}>{_new.amount} {_new.symbol}</span>
                    </div>
                    : null}
                {
                    props.expiredAt ?
                        <>
                            {_claimable ?
                                <div className={styles.bold} >Claimable:{isJustClaimable ? <br /> : ' '}{_claimable.amount} {_claimable.symbol}</div>
                                : null}
                        </>
                        :
                        <>
                            {_total ?
                                <div className={styles.bold} >Total: {_total?.amount} {_total?.symbol}</div>
                                : null}
                        </>
                }
            </div>
            <hr className={styles.hr} />
            <div className={`${styles.notification_details} ${styles.no_wallet_notification_details}`}>
                {props.expiredAt ?
                    <div>Connect to avoid expiration<br />Deadline: {formatDate(props.expiredAt)}</div>
                    :
                    <div>Connect your wallet to<br />safeguard your cashback</div>
                }
            </div>
        </div>
    )
}

interface Notification {
    platformName: string
    cashbackUrl: string
    textMode: 'upper' | 'lower'
    new: Reward | null
    total: Reward | null
    eligible: Reward | null
    expiredAt: number | null
    isRemindingPeriod: boolean
    promptPairing: boolean
}

const Notification = () => {
    const { platformName, textMode, cashbackUrl, new: _new, eligible, total, expiredAt, promptPairing } = useRouteLoaderData('root') as Notification
    const { walletAddress } = useWalletAddress()
    const ctaText = !promptPairing ? 'Details' : eligible ? 'Claim' : 'Connect'
    const isExtraBtn = !_new
    const { start, clear } = useTimeout({
        callback: () => sendMessage({ action: ACTIONS.ERASE_NOTIFICATION }),
        delay: 60 * 1000
    })

    useEffect(() => {
        const style = notificationIframeStyle[platformName.toLowerCase()] || notificationIframeStyle['default']

        if (promptPairing) {
            style.width = '699px';
            style.height = '70px';
        }

        sendMessage({ action: ACTIONS.OPEN, style })

    }, [platformName, promptPairing])

    useEffect(() => {
        start()
        return () => {
            clear()
        }
    }, [clear, start])

    const notificationSeen = () => {
        clear()
        sendMessage({ action: ACTIONS.ERASE_NOTIFICATION })
    }

    const openCashbackPage = () => {
        if (!walletAddress) {
            sendMessage({ action: ACTIONS.PROMPT_LOGIN })
        } else {
            sendMessage({ action: ACTIONS.OPEN_CASHBACK_PAGE, url: cashbackUrl })
        }
        notificationSeen()
        sendMessage({ action: ACTIONS.CLOSE })
    }

    const stopReminders = () => {
        sendMessage({ action: ACTIONS.STOP_REMINDERS })
        notificationSeen()
        sendMessage({ action: ACTIONS.CLOSE })
    }

    if (!promptPairing) {
        return (
            <div className={styles.container}>
                <PlatformLogo
                    platformName={platformName}
                    size='sm'
                    width={28}
                />
                <div className={styles.notification_details}>New cashback reward</div>
                <button
                    className={styles.link}
                    onClick={openCashbackPage}
                >
                    {toCaseString(ctaText, textMode)}
                </button>
                <CloseBtn
                    callback={notificationSeen}
                    className={styles.close_btn}
                />
            </div>
        )
    }

    return (
        <div className={`${styles.container} ${styles.no_wallet_container}`}>
            <PlatformLogo
                platformName={platformName}
                size='sm'
                width={28}
            />
            <NotificationText
                new={_new}
                total={total}
                claimable={eligible}
                expiredAt={expiredAt}
                minWidth={isExtraBtn ? 'auto' : undefined}
            />
            <button
                className={`${styles.link} ${styles.no_wallet_link} ${isExtraBtn ? styles.no_wallet_link_short : styles.no_wallet_link}`}
                onClick={openCashbackPage}
            >
                {toCaseString(ctaText, textMode)}
            </button>
            {isExtraBtn ?
                <button
                    className={`${styles.link} ${styles.no_wallet_link}`}
                    onClick={stopReminders}
                >
                    {toCaseString('Stop reminding', textMode)}
                </button>
                : null}
            <CloseBtn
                callback={notificationSeen}
                className={styles.no_wallet_close_btn}
            />
        </div>
    )
}

export default Notification