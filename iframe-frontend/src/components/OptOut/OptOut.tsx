import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage';
import { useState, useCallback } from 'react';
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics';
import { useRouteLoaderData } from 'react-router-dom';
import toCapital from '../../utils/toCapital';
import toCaseString from '../../utils/toCaseString';

interface Option {
    label: string
    value: number | string | boolean
    id: string
}

const websiteOptions: Option[] = [
    { label: 'For this website', value: false, id: 'websiteOption0' },
    { label: 'For all websites', value: true, id: 'websiteOption1' }
]

const durationOptions: Option[] = [
    { label: '24 hours', value: 24 * 60 * 60 * 1000, id: 'durationOption0' },
    { label: '30 days', value: 30 * 24 * 60 * 60 * 1000, id: 'durationOption1' },
    { label: 'forever', value: 999999999999999, id: 'durationOption2' },
]

const dict = {
    '24 hours': '24Hours',
    '30 days': '30Days',
    'forever': 'forever'
}

interface RadioGroupProps {
    title: string
    options: Option[]
    onChange: (option: Option) => void
    defaultOption?: Option
}

const RadioGroup = ({ title, options, onChange, defaultOption }: RadioGroupProps) => {
    const [checked, setChecked] = useState<Option | null>(defaultOption || null)

    return (
        <div className={styles.radio_group}>
            <div className={styles.radio_group_title}>{title}</div>
            <div className={styles.radio_container}>
                {options.map((option) => (
                    <span
                        key={option.id}
                        className={styles.input_container}
                    >
                        <input
                            className={styles.radio}
                            onChange={() => {
                                setChecked(option)
                                onChange(option)
                            }}
                            type='radio'
                            name={title}
                            value={option.label}
                            checked={checked?.label === option.label}
                            id={option.id}
                        />
                        <label className={styles.label} htmlFor={option.id}>{option.label}</label>
                    </span>
                ))}
            </div>
        </div>
    )
}

interface Selection {
    websites: Option
    duration: Option
}

interface Props {
    onClose: () => void;
}

const OptOut = ({ onClose }: Props) => {
    const { cryptoSymbols, platformName, textMode, domain, name } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [isOpted, setIsOpted] = useState(false)
    const [selection, setSelection] = useState<Selection>({
        websites: websiteOptions[0],
        duration: durationOptions[0]
    })

    const handleClose = useCallback((): void => {
        if (isOpted) {
            sendMessage({ action: ACTIONS.CLOSE })
        } else {
            onClose()
        }
    }, [isOpted, onClose])

    const handleOptOut = () => {
        if (isOpted) return
        setIsOpted(true)
        
        const { websites, duration } = selection

        const event = {
            action: websites.value ? ACTIONS.OPT_OUT : ACTIONS.OPT_OUT_SPECIFIC,
            time: +duration.value,
            domain,
            key: dict[duration.label as keyof typeof dict]
        }

        sendMessage(event)
        sendGaEvent(websites.value ? 'opt_out' : 'opt_out_specific', {
            category: 'user_action',
            action: 'click',
            details: duration.label,
            domain,
            retailerName: name
        })
    }

    return (
        <div
            id="opt-out-container"
            className={styles.container}>
            {!isOpted ?
                <>
                    <div id="opt-out-card" className={styles.card}>
                        <div id="opt-out-title" className={styles.title}>Turn off Cashback offers</div>
                        <div id="opt-out-description" className={styles.description}>
                            With {toCapital(platformName)}'s cashback you earn {cryptoSymbols[0]}, right in<br />your wallet, on everyday purchases
                        </div>
                        <RadioGroup
                            options={websiteOptions}
                            title={`Turn off cashback offers`}
                            onChange={(option => setSelection({ ...selection, websites: option }))}
                            defaultOption={websiteOptions[0]}
                        />
                        <RadioGroup
                            options={durationOptions}
                            title={`For`}
                            onChange={(option => setSelection({ ...selection, duration: option }))}
                            defaultOption={durationOptions[0]}
                        />
                    </div>
                    <button
                        id="opt-out-apply-btn"
                        className={`${styles.btn} ${styles.apply_btn}`}
                        onClick={handleOptOut}
                    >
                        {toCaseString('Apply', textMode)}
                    </button>
                    <button
                        id="opt-out-back-btn"
                        className={`${styles.btn} ${styles.close_btn}`}
                        onClick={handleClose}
                    >
                        {toCaseString('Back to activation', textMode)}
                    </button>
                </>
                :
                <div id="opt-out-subcontainer" className={styles.subcontainer}>
                    <div id="opt-out-confirmation-card" className={styles.card} style={{ justifyContent: 'space-between' }}>
                        <div id="opt-out-confirmation-title" className={styles.title}>
                            Cashback offers turned off
                        </div>
                        <div id="opt-out-confirmation-description" className={styles.description}>
                            Your request to turn off cashback offers has been received.<br />
                            You will no longer see {toCapital(platformName)}'s cashback offers {!selection.websites.value ? 'on this website' : 'across all websites'} {selection.duration.label === 'forever' ? selection.duration.label : `for the next ${selection.duration.label}`}.
                        </div>

                    </div>
                    <button
                        id="opt-out-close-btn"
                        className={`${styles.btn} ${styles.close_btn}`}
                        onClick={handleClose}
                    >
                        {toCaseString('Close', textMode)}
                    </button>
                </div>
            }
        </div >
    )
}

export default OptOut