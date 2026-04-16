import { useRouteLoaderData } from 'react-router-dom'
import { useState } from 'react'
import { sendMessage, ACTIONS } from '../../../utils/sendMessage'
import { useGoogleAnalytics } from '../../../hooks/useGoogleAnalytics'
import styles from './styles.module.css'

interface Props {
    closeFn: () => void
    onOptOut: () => void
    onConfirmClose: () => void
}

const durationOptions = [
    { label: '24 hours', value: 24 * 60 * 60 * 1000 },
    { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Forever', value: 999999999999999 },
]

const dict = {
    '24 hours': '24Hours',
    '30 days': '30Days',
    'Forever': 'forever'
}

const Optout = ({ closeFn, onOptOut, onConfirmClose }: Props) => {
    const { domain, name } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [isOpted, setIsOpted] = useState(false)
    const [selectedOption, setSelectedOption] = useState(durationOptions[0]) // 24 hours by default

    const handleOptOut = (duration: typeof durationOptions[0]) => {
        const event: Message = {
            action: ACTIONS.OPT_OUT_SPECIFIC,
            domain: ['google.com'],
            type: ["kdsi"],
            isRegex: [false],
            time: +duration.value,
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

    const handleButtonClick = (option: typeof durationOptions[0]) => {
        setSelectedOption(option)
        handleOptOut(option)
    }

    return (
        <div id="tb-optout-banner" className={styles.banner}>
            {!isOpted ? (
                <>
                    {/* Back button */}
                    <button
                        id="tb-optout-back-btn"
                        className={styles.backBtn}
                        onClick={closeFn}
                    >
                        <img src="/icons/tb-back.svg" alt="Back" />
                    </button>

                    {/* Main box — text + buttons */}
                    <div className={styles.mainBox}>
                        <div className={styles.turnOff}>
                            <span id="tb-optout-title" className={styles.title}>
                                Turn off cashback offers for
                            </span>
                        </div>
                        <div id="tb-optout-buttons" className={styles.buttons}>
                            {durationOptions.map((option) => (
                                <button
                                    key={option.label}
                                    id={`tb-optout-${option.label.toLowerCase().replace(' ', '-')}-btn`}
                                    className={`${styles.optionBtn} ${
                                        selectedOption.label === option.label
                                            ? styles.selectedBtn
                                            : styles.unselectedBtn
                                    } ${option.label === 'Forever' ? styles.foreverBtn : ''}`}
                                    onClick={() => handleButtonClick(option)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        id="tb-optout-close-btn"
                        className={styles.closeBtn}
                        onClick={closeFn}
                    >
                        <img src="/icons/tb-close.svg" alt="Close" />
                    </button>
                </>
            ) : (
                /* Confirmation banner */
                <>
                    {/* Confirmation layout — centered text */}
                    <div className={styles.confirmationInner}>
                        {/* Confirmation message */}
                        <div className={styles.confirmationTextWrap}>
                            <span className={styles.confirmationText}>
                                You'll stop getting cashback offers.
                            </span>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        id="tb-optout-confirm-close-btn"
                        className={styles.confirmCloseBtn}
                        onClick={onConfirmClose}
                    >
                        <img src="/icons/tb-close.svg" alt="Close" />
                    </button>
                </>
            )}
        </div>
    )
}

export default Optout
