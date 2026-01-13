import { useRouteLoaderData } from 'react-router-dom'
import { useState, useCallback } from 'react'
import toCaseString from '../../../utils/toCaseString'
import { sendMessage, ACTIONS } from '../../../utils/sendMessage'
import { useGoogleAnalytics } from '../../../hooks/useGoogleAnalytics'
import styles from './styles.module.css'

interface Props {
    closeFn: () => void
}

const durationOptions = [
    { label: '24 Hours', value: 24 * 60 * 60 * 1000 },
    { label: '30 Days', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Forever', value: 999999999999999 },
]

const dict = {
    '24 Hours': '24Hours',
    '30 Days': '30Days',
    'Forever': 'forever'
}

const Optout = ({ closeFn }: Props) => {
    const { textMode, domain, name } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [isOpted, setIsOpted] = useState(false)

    const handleOptOut = useCallback((duration: typeof durationOptions[0]) => {
        if (isOpted) return
        setIsOpted(true)

        const event = {
            action: ACTIONS.OPT_OUT_SPECIFIC,
            time: +duration.value,
            domain,
            key: dict[duration.label as keyof typeof dict]
        }

        sendMessage(event)
        sendGaEvent('opt_out_specific', {
            category: 'user_action',
            action: 'click',
            details: duration.label,
            domain,
            retailerName: name
        })
    }, [isOpted, domain, name, sendGaEvent])

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
                        className={option.label === '24 Hours' ? styles.mainBtn : styles.secondaryBtn}
                        onClick={() => handleOptOut(option)}
                        disabled={isOpted}
                    >
                        {toCaseString(option.label, textMode)}
                    </button>
                ))}
                <button id="optout-back-btn" className={styles.backBtn} onClick={closeFn} disabled={isOpted}>
                    {toCaseString('Back', textMode)}
                </button>
            </div>
            </>:
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