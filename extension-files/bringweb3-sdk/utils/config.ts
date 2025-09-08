const safeEnvGet = (key: string): string | undefined => {
    try {
        switch (key) {
            case 'VERSION':
                return process?.env?.VERSION
            case 'ENDPOINT':
                return process?.env?.ENDPOINT
            case 'IFRAME_URL':
                return process?.env?.IFRAME_URL
            default:
                return undefined
        }
    } catch (error) {
        return undefined
    }
}

export const ENV_VERSION = safeEnvGet('VERSION')
export const ENV_ENDPOINT = safeEnvGet('ENDPOINT')
export const ENV_IFRAME_URL = safeEnvGet('IFRAME_URL')