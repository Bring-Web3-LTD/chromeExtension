import pJson from '../package.json'
import { ENV_VERSION } from './config'

const getVersion = (): string => {
    return ENV_VERSION || pJson.version
}

export default getVersion