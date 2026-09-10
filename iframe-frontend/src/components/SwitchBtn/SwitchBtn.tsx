import { useRouteLoaderData } from 'react-router-dom'
import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import Icon from '../Icon/Icon'

interface Props {
    callback?: () => void
}

const SwitchBtn = ({ callback }: Props) => {
    const { switchWallet } = useRouteLoaderData('root') as LoaderData

    const promptLogin = () => {
        sendMessage({ action: ACTIONS.PROMPT_LOGIN })
        if (callback) callback()
    }

    if (!switchWallet) {
        return null
    }

    return (
        <button
            id="switch-btn"
            className={styles.switch_btn}
            onClick={promptLogin}
            aria-label="Switch wallet"
        >
            <Icon
                id="switch-btn-icon"
                name="switch.svg"
                alt=""
            />
        </button>
    )
}

export default SwitchBtn