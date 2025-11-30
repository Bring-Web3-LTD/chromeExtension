import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useState, useCallback } from 'react'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import toCapital from '../../utils/toCapital'
import toCaseString from '../../utils/toCaseString'

interface Option {
    label: string
    value: number | string | boolean
    id: string
    action?: ACTIONS
}

const websiteOptions: Option[] = [
    { label: 'For this search term', value: 'search', id: 'websiteOption0', action: ACTIONS.OPT_OUT_SEARCH_TERM },
    { label: 'For this website', value: false, id: 'websiteOption1', action: ACTIONS.OPT_OUT_SPECIFIC },
    { label: 'For all websites', value: true, id: 'websiteOption2', action: ACTIONS.OPT_OUT }
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
    onClose: () => void
}

const OfferLineOptOut = ({ onClose }: Props) => {
    const { cryptoSymbols, platformName, textMode, domain, offerlineDomain, name, domainPattern, searchTermPattern } = useRouteLoaderData('root') as LoaderData
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
        const { duration } = selection

        const event: Message = {
            action: ACTIONS.OPT_OUT_OFFER_LINE,
            time: +duration.value,
            key: dict[duration.label as keyof typeof dict]
        }

        sendMessage(event)
        setIsOpted(true)

        sendGaEvent('opt_out_offer_line' as any, {
            category: 'user_action',
            action: 'click',
            details: duration.label,
            domain,
            retailerName: name
        })
    }

    return (
        <div
            id="offerline-opt-out-container"
            className={styles.container}>
            {!isOpted ?
                <>
                    <div id="offerline-opt-out-card" className={styles.card}>
                        <div id="offerline-opt-out-title" className={styles.title}>Turn off Cashback offers</div>
                        <div id="offerline-opt-out-description" className={styles.description}>
                            With {toCapital(platformName)}'s cashback you earn {cryptoSymbols[0]}, right in<br />your wallet, on everyday purchases
                        </div>
                        <RadioGroup
                            options={durationOptions}
                            title={`Turn off cashback offers for`}
                            onChange={(option => setSelection({ ...selection, duration: option }))}
                            defaultOption={durationOptions[0]}
                        />
                    </div>
                    <button
                        id="offerline-opt-out-apply-btn"
                        className={`${styles.btn} ${styles.apply_btn}`}
                        onClick={handleOptOut}
                    >
                        {toCaseString('Apply', textMode)}
                    </button>
                    <button
                        id="offerline-opt-out-cancel-btn"
                        className={`${styles.btn} ${styles.cancel_btn}`}
                        onClick={handleClose}
                    >
                        {toCaseString('Cancel', textMode)}
                    </button>
                </>
                :
                <>
                    <div id="offerline-opt-out-success-card" className={styles.card}>
                        <div id="offerline-opt-out-success-title" className={styles.title}>Settings updated</div>
                        <div id="offerline-opt-out-success-description" className={styles.description}>
                            You won't receive cashback offers for {selection.duration.label}
                        </div>
                    </div>
                    <button
                        id="offerline-opt-out-close-btn"
                        className={`${styles.btn} ${styles.apply_btn}`}
                        onClick={handleClose}
                    >
                        {toCaseString('Close', textMode)}
                    </button>
                </>
            }
        </div>
    )
}

export default OfferLineOptOut
