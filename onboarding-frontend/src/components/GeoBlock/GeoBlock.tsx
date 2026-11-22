import styles from './styles.module.css'

/**
 * "Not live in your area" screen (TODO#802), the Rewards Hub "Geo Block" design:
 * shown when the campaign's platform is not live in the visitor's country.
 * No close button and no action by design.
 */
const GeoBlock = () => (
    <main className={styles.overlay}>
        <div className={styles.card}>
            <svg className={styles.icon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M42 24C42 33.9411 33.9411 42 24 42C14.0589 42 6 33.9411 6 24C6 14.0589 14.0589 6 24 6C33.9411 6 42 14.0589 42 24Z" strokeWidth="3.2" stroke="#FFEF46" />
                <path d="M6 24H42M24 6C29 11.2 31.6 17.2 31.6 24C31.6 30.8 29 36.8 24 42C19 36.8 16.4 30.8 16.4 24C16.4 17.2 19 11.2 24 6Z" strokeWidth="3.2" strokeLinejoin="round" stroke="#FFEF46" />
            </svg>
            <h1 className={styles.title}>We&rsquo;re sorry but this service is not yet live in your area.</h1>
            <p className={styles.body}>Please check again in a few weeks</p>
        </div>
    </main>
)

export default GeoBlock
