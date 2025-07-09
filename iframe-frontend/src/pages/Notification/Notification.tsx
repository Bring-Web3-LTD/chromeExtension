import { useRouteLoaderData } from 'react-router-dom'
import styles from './styles.module.css'
import PlatformLogo from "../../components/PlatformLogo/PlatformLogo"
import CloseBtn from '../../components/CloseBtn/CloseBtn'
import { useEffect } from 'react'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { notificationIframeStyle } from '../../utils/iframeStyles'
import toCaseString from '../../utils/toCaseString'
import useTimeout from '../../hooks/useTimeout'

interface Notification {
    platformName: string
    cashbackUrl: string
    textMode: 'upper' | 'lower'
    info: {
        new: boolean
        eligible: boolean
    }
}

const Notification = () => {
    const data = useRouteLoaderData('root') as Notification

    const { start, clear } = useTimeout({
        callback: () => sendMessage({ action: ACTIONS.ERASE_NOTIFICATION }),
        delay: 60 * 1000
    })

    useEffect(() => {
        sendMessage({ action: ACTIONS.OPEN, style: notificationIframeStyle[data.platformName.toLowerCase()] || notificationIframeStyle['default'] })
        start()
        return () => {
            clear()
        }
    }, [clear, data.platformName, start])

    const notificationSeen = () => {
        clear()
        sendMessage({ action: ACTIONS.ERASE_NOTIFICATION })
    }

    const openCashbackPage = () => {
        sendMessage({ action: ACTIONS.OPEN_CASHBACK_PAGE, url: data.cashbackUrl })
        notificationSeen()
    }

    return (
        <div className={styles.container}>
            <PlatformLogo
                platformName={data.platformName}
                size='sm'
                width={40}
            />
            <div className={styles.notification_details}>New cashback reward</div>
            <button
                className={styles.link}
                onClick={openCashbackPage}
            >
                {toCaseString('Details', data.textMode)}
            </button>
            <CloseBtn
                callback={notificationSeen}
            />
        </div>
    )
}

export default Notification