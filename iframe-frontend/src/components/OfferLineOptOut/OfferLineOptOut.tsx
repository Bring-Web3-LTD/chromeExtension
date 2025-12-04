import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useState } from 'react'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import toCaseString from '../../utils/toCaseString'
import PlatformLogo from '../PlatformLogo/PlatformLogo'
import OfferLineCloseBtn from '../OfferLineCloseBtn/OfferLineCloseBtn'

interface Option {
    label: string
    value: number | string | boolean
    id: string
    action?: ACTIONS
}

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

interface Selection {
    duration: Option
}

interface Props {
    onClose: () => void
}

const OfferLineOptOut = ({ onClose }: Props) => {
    const { platformName, textMode, domain, name } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    
    const [isOpted, setIsOpted] = useState(false)
    const [selection, setSelection] = useState<Selection>({
        duration: durationOptions[0]
    })

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
                    <div className={styles.logo_outer_wrapper}>
                        <div className={styles.logo_wrapper}>
                            <PlatformLogo platformName={platformName} size="sm" width={22} height={19} />
                        </div>
                        <div className={styles.pause_text}>Pause for:</div>
                    </div>
                    <div className={styles.actions_wrapper}>
                        <div className={styles.buttons}>
                            <button
                                className={styles.duration_btn}
                                onClick={() => {
                                    setSelection({ ...selection, duration: durationOptions[0] })
                                    handleOptOut()
                                }}
                            >
                                {toCaseString('24 Hours', textMode)}
                            </button>
                            <button
                                className={styles.duration_btn}
                                onClick={() => {
                                    setSelection({ ...selection, duration: durationOptions[1] })
                                    handleOptOut()
                                }}
                            >
                                {toCaseString('30 Days', textMode)}
                            </button>
                            <button
                                className={styles.duration_btn}
                                onClick={() => {
                                    setSelection({ ...selection, duration: durationOptions[2] })
                                    handleOptOut()
                                }}
                            >
                                {toCaseString('Forever', textMode)}
                            </button>
                        </div>
                        <div className={styles.close_btn_wrapper}>
                            <OfferLineCloseBtn callback={onClose} withTime={false} />
                        </div>
                    </div>
                </>
                :
                <>
                    <div className={styles.logo_outer_wrapper}>
                        <div className={styles.logo_wrapper}>
                            <PlatformLogo platformName={platformName} size="sm" width={22} height={19} />
                        </div>
                        <div className={styles.success_message}>
                            Cashback paused for {selection.duration.label}
                        </div>
                    </div>
                    <div className={styles.success_close_wrapper}>
                        <OfferLineCloseBtn />
                    </div>
                </>
            }
        </div>
    )
}

export default OfferLineOptOut
