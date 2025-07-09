import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import compareVersions from '../../utils/compareVersions'
import parseTime from '../../utils/parseTime'

interface Props {
    callback?: () => void
    withTime?: boolean
}

const THIRTY_MIN_MS = 30 * 60 * 1000

const CloseBtn = ({ callback, withTime = true }: Props) => {
    const { domain, version } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()

    const close = async () => {
        await sendGaEvent('popup_close', {
            category: 'user_action',
            action: 'click',
            details: 'extension'
        })
        if (compareVersions(version, '1.2.6') !== 1) {
            sendMessage({ action: ACTIONS.ACTIVATE, url: `https://${domain}` })
        }

        const message: Parameters<typeof sendMessage>[0] = { action: ACTIONS.CLOSE, domain, }
        if (withTime) message.time = parseTime(THIRTY_MIN_MS, version)

        sendMessage(message)
    }

    return (
        <button
            onClick={() => {
                close()
                callback && callback()
            }}
            className={styles.btn}
        >
            <div
                className={styles.icon}
            />
        </button>
    )
}

export default CloseBtn