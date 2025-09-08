import styles from './styles.module.css'
import PlatformLogo from '../PlatformLogo/PlatformLogo';
import { useRouteLoaderData } from 'react-router-dom';
import toCapital from '../../utils/toCapital';

const CollaborationLogos = () => {
    const { iconUrl, name, platformName } = useRouteLoaderData('root') as LoaderData

    return (
        <div className={styles.logos_container} >
            <div className={styles.logo_container} >
                <div className={styles.logo_wrapper} >
                    <img
                        src={iconUrl}
                        className={styles.logo}
                        alt={`${name}-website-icon`}
                    />
                </div>
                <div className={styles.logo_text}>
                    {name}
                </div>
            </div>
            <img
                src={`${import.meta.env.BASE_URL}icons/plus-sign.svg`}
                alt="plus-sign"
                className={styles.plus_logo}
            />
            <div className={styles.logo_container} >
                <div className={styles.logo_wrapper} >
                    <PlatformLogo
                        platformName={platformName}
                        width={49}
                    />
                </div>
                <div className={styles.logo_text}>{toCapital(platformName)} wallet</div>
            </div>
        </div>
    )
}

export default CollaborationLogos;