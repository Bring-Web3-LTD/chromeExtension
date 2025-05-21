import styles from './styles.module.css'
// Functions
import { sendMessage, ACTIONS } from '../../utils/sendMessage';
import compareVersions from '../../utils/compareVersions';
// Components
import { motion, AnimatePresence } from 'framer-motion';
// Hooks
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics';
import { useRouteLoaderData } from 'react-router-dom';

interface Props {
    onClose: () => void;
    open: boolean
}

const TWENTYFOUR_HOURS = 24 * 60 * 60 * 1000

const options = [
    { label: '24 hours', time: TWENTYFOUR_HOURS },
    // { label: '7 days', time: 7 * TWENTYFOUR_HOURS },
    { label: '30 days', time: 30 * TWENTYFOUR_HOURS },
    { label: 'forever', time: 999999999999999 },
]

const dict = {
    '24 hours': '24Hours',
    // '7 days': '7Days',
    '30 days': '30Days',
    'forever': 'forever'
}

const OptOut = ({ open, onClose }: Props) => {
    const { version, domain } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()

    const isNewVersion = compareVersions(version, '1.4.1') !== -1

    const [optOutGlobal, setOptOutGlobal] = useState(true)
    const [stage, setStage] = useState<'scope' | 'period' | 'completed'>(isNewVersion ? 'scope' : 'period')

    const popupRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback((): void => {
        if (stage === 'completed') {
            sendMessage({ action: ACTIONS.CLOSE })
        } else {
            onClose()
        }
    }, [stage, onClose])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                handleClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, stage, handleClose]);

    const handleOptOut = (time: number, label: string) => {
        const event: Parameters<typeof sendGaEvent>[1] = {
            category: 'user_action',
            action: 'click',
            details: label,
        }

        if (!optOutGlobal && isNewVersion) {
            sendMessage({ action: ACTIONS.OPT_OUT_SPECIFIC, domain, time })
            event.from = domain
        } else {
            sendMessage({ action: ACTIONS.OPT_OUT, time, key: dict[label as keyof typeof dict] })
            event.from = 'global'
        }
        sendGaEvent('opt_out', event)
        setStage('completed')
    }

    const handleScopeStage = (isGlobal: boolean): void => {
        setOptOutGlobal(isGlobal)
        setStage('period')
    }

    return (
        <AnimatePresence>
            {open ?
                <motion.div
                    transition={{ ease: 'easeInOut' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={styles.overlay}>
                    <motion.div
                        ref={popupRef}
                        transition={{ ease: 'easeInOut' }}
                        initial={{ y: '100px' }}
                        animate={{ y: '0' }}
                        exit={{ y: '100px' }}
                        className={styles.card}>
                        {
                            // isNewVersion &&
                            stage !== 'completed' ? <button
                                className={`${styles.back_btn} ${styles.x_btn}`}
                                onClick={handleClose}
                            >
                                <div className={styles.x_icon}></div>
                            </button> : null}
                        {stage === 'scope' ?
                            <>
                                <button
                                    className={styles.back_btn}
                                    onClick={() => {
                                        handleClose()
                                    }}
                                >
                                    Close
                                </button>
                                <div className={styles.title}>Turn off Cashback offers</div>
                                <div className={styles.container}>
                                    <button
                                        className={styles.btn}
                                        onClick={() => handleScopeStage(true)}
                                    >
                                        Global
                                    </button>
                                    <button
                                        className={styles.btn}
                                        onClick={() => handleScopeStage(false)}
                                    >
                                        Specific
                                    </button>
                                </div>
                            </>
                            :
                            stage === 'period' ?
                                <>
                                    <button
                                        className={styles.back_btn}
                                        onClick={() => {
                                            if (isNewVersion) {
                                                setStage('scope')
                                            } else {
                                                handleClose()
                                            }
                                        }}
                                    >
                                        {isNewVersion ? 'Back' : 'Close'}
                                    </button>
                                    <div className={styles.title}>
                                        {`Turn off Cashback offers for${isNewVersion ? ` ${optOutGlobal ? 'all stores' : 'this store'}` : ''}`}
                                    </div>
                                    <div className={styles.container}>
                                        {options.map((option) => (
                                            <button
                                                key={option.label}
                                                className={styles.btn}
                                                onClick={() => handleOptOut(option.time, option.label)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                                :
                                <>
                                    <div className={styles.message}>We’ve turned off cashback offers for you.</div>
                                    <button
                                        className={styles.close_btn}
                                        onClick={handleClose}
                                    >
                                        CLOSE
                                    </button>
                                </>
                        }
                    </motion.div >
                </motion.div>
                :
                null
            }
        </AnimatePresence>
    )
}

export default OptOut