import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../../utils/sendMessage'
import { useGoogleAnalytics } from '../../../hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import Icon from '../../../components/Icon/Icon'
import compareVersions from '../../../utils/compareVersions'
import parseTime from '../../../utils/parseTime'
interface Props {
    callback?: () => void
}

const THIRTY_MIN_MS = 30 * 60 * 1000

const CloseBtn = ({ callback }: Props) => {
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

        sendMessage({ action: ACTIONS.CLOSE, domain, time: parseTime(THIRTY_MIN_MS, version) })
    }

    return (
        <button
            id="template-close-btn"
            onClick={() => {
                close()
                callback && callback()
            }}
            className={styles.btn}
        >
            <Icon id="template-close-btn-icon" name="x-mark.svg" alt="exit icon" />
        </button>
    )
}

export default CloseBtn