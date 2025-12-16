import styles from './styles.module.css'
import PlatformLogo from '../PlatformLogo/PlatformLogo';
import { useRouteLoaderData } from 'react-router-dom';

const OfferLineLogos = () => {
    const { iconUrl, name, platformName } = useRouteLoaderData('root') as LoaderData

    return (
        <div className={styles.logos_wrapper}>
            <div id="offerline-logos-container" className={styles.logos_container} >
            <div 
                id="offerline-platform-logo-wrapper" 
                className={styles.logo_wrapper}
                style={{ 
                    background: 'var(--offerline-logo-bg, white)',
                    border: 'var(--logo-border-w, 0) solid var(--logo-border-c, transparent)'
                }}
            >
                <PlatformLogo
                    platformName={platformName}
                    width={16}
                    height={14}
                />
            </div>
            <div className={styles.plus_wrapper}>+</div>
            <div id="offerline-retailer-logo-wrapper" className={styles.logo_wrapper} >
                <img
                    id="offerline-retailer-logo"
                    src={iconUrl}
                    className={styles.logo}
                    alt={`${name}-website-icon`}
                />
            </div>
        </div>
        </div>
    )
}

export default OfferLineLogos;
