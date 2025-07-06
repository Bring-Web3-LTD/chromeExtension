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
}

const websiteOptions: Option[] = [
    { label: 'For this website', value: 0 },
    { label: 'For all websites', value: 1 }
]

const durationOptions: Option[] = [
    { label: '24 hours', value: 24 * 60 * 60 * 1000 },
    { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'forever', value: 999999999999999 },
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
                        key={option.label}
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'white' }}
                    >
                        <input
                            className={styles.radio}
                            onChange={() => {
                                setChecked(option)
                                onChange(option)
                            }}
                            type='radio'
                            name={title}
                            id={option.label}
                            value={option.label}
                            checked={checked?.label === option.label}
                        />
                        <label className={styles.label} htmlFor={option.label}>{option.label}</label>
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
    const { cryptoSymbols, platformName, textMode } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [isOpted, setIsOpted] = useState(false)
    const [selection, setSelection] = useState({
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

    const handleOptOut = (selection: Selection) => {
        const { websites, duration } = selection
        console.log(websites, duration)
        sendMessage({ action: ACTIONS.OPT_OUT, time: +duration.value, key: dict[duration.label as keyof typeof dict] })
        setIsOpted(true)
        // sendGaEvent('opt_out', {
        //     category: 'user_action',
        //     action: 'click',
        //     details: label
        // })
    }

    return (
        <div
            className={styles.container}>
            {!isOpted ?
                <div className={styles.card}>
                    <div className={styles.title}>Turn off Cashback offers</div>
                    <div className={styles.description}>
                        With {toCapital(platformName)}’s cashback you earn {cryptoSymbols[0]}, right in<br />your wallet, on everyday purchases
                    </div>
                    <RadioGroup
                        options={websiteOptions}
                        title={`Where do you want to turn off ${cryptoSymbols[0]} cashback?`}
                        onChange={(option => setSelection({ ...selection, websites: option }))}
                        defaultOption={websiteOptions[0]}
                    />
                    <RadioGroup
                        options={durationOptions}
                        title={`Choose when to hide cashback offers`}
                        onChange={(option => setSelection({ ...selection, duration: option }))}
                        defaultOption={durationOptions[0]}
                    />
                </div>
                :
                <div className={styles.message}>Your request to turn off offers has been received. You can reactivate them anytime in settings.</div>
            }
            <button
                className={`${styles.btn} ${styles.apply_btn}`}
                onClick={handleOptOut}
            >
                {toCaseString('Apply', textMode)}
            </button>
            <button
                className={`${styles.btn} ${styles.close_btn}`}
                onClick={handleClose}
            >
                {toCaseString('Back to activation', textMode)}
            </button>
        </div >
    )
}

export default OptOut