import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import parseTime from '../../utils/parseTime'

interface Props {
    callback?: () => void
    withTime?: boolean
}

const THIRTY_MIN_MS = 30 * 60 * 1000

const OfferLineCloseBtn = ({ callback, withTime = true }: Props) => {
    const { searchTermPattern, version } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()

    const close = async () => {
        await sendGaEvent('popup_close', {
            category: 'user_action',
            action: 'click',
            details: 'extension'
        })

        const message: Parameters<typeof sendMessage>[0] = { 
            action: ACTIONS.CLOSE, 
            domain: searchTermPattern 
        }
        if (withTime) message.time = parseTime(THIRTY_MIN_MS, version)

        sendMessage(message)
    }

    return (
        <button
            id="offerline-close-btn"
            onClick={callback || close}
            className={styles.btn}
        >
            <div
                id="offerline-close-btn-icon"
                className={styles.icon}
            />
        </button>
    )
}

export default OfferLineCloseBtn
