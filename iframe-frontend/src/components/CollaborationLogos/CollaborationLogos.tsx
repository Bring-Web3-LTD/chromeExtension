import styles from './styles.module.css'
import PlatformLogo from '../PlatformLogo/PlatformLogo';
import { useRouteLoaderData } from 'react-router-dom';
import toCapital from '../../utils/toCapital';

const CollaborationLogos = () => {
    const { iconUrl, name, platformName } = useRouteLoaderData('root') as LoaderData

    return (
        <div id="collaboration-logos-container" className={styles.logos_container} >
            <div id="retailer-logo-container" className={styles.logo_container} >
                <div id="retailer-logo-wrapper" className={styles.logo_wrapper} >
                    <img
                        id="retailer-logo"
                        src={iconUrl}
                        className={styles.logo}
                        alt={`${name}-website-icon`}
                    />
                </div>
                <div id="retailer-logo-text" className={styles.logo_text}>
                    {name}
                </div>
            </div>
            <img
                id="plus-sign-icon"
                src={`${import.meta.env.BASE_URL}icons/plus-sign.svg`}
                alt="plus-sign"
                className={styles.plus_logo}
            />
            <div id="platform-logo-container" className={styles.logo_container} >
                <div id="platform-logo-wrapper" className={styles.logo_wrapper} >
                    <PlatformLogo
                        platformName={platformName}
                    />
                </div>
                <div id="platform-logo-text" className={styles.logo_text}>{toCapital(platformName)} wallet</div>
            </div>
        </div>
    )
}

export default CollaborationLogos;