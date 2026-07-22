import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import compareVersions from '../../utils/compareVersions'
import parseTime from '../../utils/parseTime'

interface Props {
    callback?: () => void
    withTime?: boolean
    time?: number
    className?: string
    type?: string
    /**
     * When provided, the X takes over the click entirely: it runs this handler and
     * does NOT send CLOSE / write to quietDomains (used by the collapsed widget, where
     * the X collapses the AB back to the badge instead of suppressing the domain).
     */
    overrideClose?: () => void
}

const THIRTY_MIN_MS = 30 * 60 * 1000

const CloseBtn = ({ callback, withTime = true, time, className = '', type, overrideClose }: Props) => {
    const { domain, version, verifiedMatch } = useRouteLoaderData('root') as LoaderData
    const { sendAnalyticsEvent } = useAnalytics()

    const close = async () => {
        await sendAnalyticsEvent('popup_close', {
            category: 'user_action',
            action: 'click',
            details: 'extension'
        })

        // Widget mode: analytics still fire above; we just collapse back to the badge
        // instead of removing the iframe + writing to quietDomains.
        if (overrideClose) {
            overrideClose()
            return
        }

        if (compareVersions(version, '1.2.6') !== 1) {
            sendMessage({ action: ACTIONS.ACTIVATE, url: `https://${domain}` })
        }

        const quietDomain = (verifiedMatch && !verifiedMatch.isRegex) ? verifiedMatch.match : domain
        const message: Parameters<typeof sendMessage>[0] = { action: ACTIONS.CLOSE, domain: quietDomain }
        if (withTime) message.time = parseTime(time ?? THIRTY_MIN_MS, version)
        if (type) message.type = type

        sendMessage(message)
    }

    return (
        <button
            id="close-btn"
            onClick={() => {
                close()
                callback && callback()
            }}
            className={`${styles.btn} ${className}`}
        >
            <div
                id="close-btn-icon"
                className={styles.icon}
                style={{
                    maskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`,
                    WebkitMaskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`
                }}
            />
        </button>
    )
}

export default CloseBtn