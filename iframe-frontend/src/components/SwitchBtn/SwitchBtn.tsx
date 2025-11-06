import { useRouteLoaderData } from 'react-router-dom'
import styles from './styles.module.css'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'

interface Props {
    callback?: () => void
}

const SwitchBtn = ({ callback }: Props) => {
    const { iconsPath, switchWallet } = useRouteLoaderData('root') as LoaderData

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
        >
            <img
                id="switch-btn-icon"
                src={`${iconsPath}/switch.svg`}
                alt="switch icon"
            />
        </button>
    )
}

export default SwitchBtn