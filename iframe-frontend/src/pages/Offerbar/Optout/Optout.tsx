import { useRouteLoaderData } from 'react-router-dom'
import { useState } from 'react'
import toCaseString from '../../../utils/toCaseString'
import { sendMessage, ACTIONS } from '../../../utils/sendMessage'
import { useGoogleAnalytics } from '../../../hooks/useGoogleAnalytics'
import styles from './styles.module.css'

interface Props {
    closeFn: () => void
    onOptOut: () => void
}

const durationOptions = [
    { label: '24 hours', value: 24 * 60 * 60 * 1000 },
    { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'forever', value: 999999999999999 },
]

const dict = {
    '24 hours': '24Hours',
    '30 days': '30Days',
    'forever': 'forever'
}

const Optout = ({ closeFn, onOptOut }: Props) => {
    const { textMode, domain, name, platformName } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [isOpted, setIsOpted] = useState(false)


    const handleOptOut = (duration: typeof durationOptions[0]) => {
        // Temp fix: "forever" sends time=999999999999999, whose range exceeds the 60-day
        // cleanup cap and gets wiped immediately. Send exactly 60 days and mark type with 'a'
        // so the backend can later reset these to true forever.
        const isForever = duration.label === 'forever'
        const event: Message = {
            action: ACTIONS.OPT_OUT_SPECIFIC,
            domain: ['google.com'],
            type: isForever ? ["kdsia"] : ["kdsi"],
            isRegex: [false],
            time: isForever ? 60 * 24 * 60 * 60 * 1000 : +duration.value,
            key: dict[duration.label as keyof typeof dict]
        }

        sendMessage(event)
        setIsOpted(true)
        onOptOut()

        sendGaEvent('opt_out', {
            category: 'user_action',
            action: 'click',
            details: duration.label,
            domain,
            retailerName: name
        })
    }

    return (
        <div id="optout-container" className={styles.container}>
            {!isOpted ?
                <>
                    <div id="optout-title" className={styles.title}>
                        Turn off cashback offers for
                    </div>
                    <div id="optout-options-container" className={styles.optionsContainer}>
                        {durationOptions.map((option) => (
                            <button
                                key={option.label}
                                id={`optout-${option.label.toLowerCase().replace(' ', '-')}-btn`}
                                className={option.label === '24 hours' ? styles.mainBtn : styles.secondaryBtn}
                                onClick={() => handleOptOut(option)}
                                disabled={isOpted}
                            >
                                {toCaseString(option.label, textMode, platformName)}
                            </button>
                        ))}
                        <button id="optout-back-btn" className={styles.backBtn} onClick={closeFn} disabled={isOpted}>
                            Back
                        </button>
                    </div>
                </> :
                <div id="optout-confirmation">
                    <div id="optout-confirmation-title" className={`${styles.title} ${styles.optedTitle}`}>
                        You’ll stop seeing cashback offers.
                    </div>
                </div>
            }
        </div>
    )
}

export default Optout