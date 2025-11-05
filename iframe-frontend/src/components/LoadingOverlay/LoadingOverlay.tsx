import styles from './styles.module.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Oval } from 'react-loader-spinner'

interface Props {
    open: boolean
    text?: string
}

const LoadingOverlay = ({ open, text = "Log into your wallet to proceed" }: Props) => {
    return (
        <AnimatePresence>
            {open ?
                <motion.div
                    id="loading-overlay"
                    transition={{ ease: 'easeInOut' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={styles.waiting}>
                    <div id="loading-message" className={styles.message}>{text}</div>
                    <Oval
                        visible={true}
                        height="60"
                        width="60"
                        strokeWidth="4"
                        strokeWidthSecondary="4"
                        color="var(--loader-bg)"
                        secondaryColor=""
                        ariaLabel="oval-loading"
                    />
                </motion.div>
                : null}
        </AnimatePresence>
    )
}

export default LoadingOverlay