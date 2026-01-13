import styles from './styles.module.css'
import { useRouteLoaderData } from "react-router-dom"
import PlatformLogo from "../../../components/PlatformLogo/PlatformLogo"

const Logos = () => {
    const { platformName, iconUrl } = useRouteLoaderData('root') as LoaderData
    return (
        <div className={styles.container}>
            <div className={styles.platform_logo_container}>
                <PlatformLogo size='ob' platformName={platformName} />
            </div>
            <img
                src={iconUrl}
                className={styles.retailer_logo}
                alt="retailer-logo"
            />
        </div>
    )
}

export default Logos