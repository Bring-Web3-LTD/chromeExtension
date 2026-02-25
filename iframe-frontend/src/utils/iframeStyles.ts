
interface Styles {
    [key: string]: { [key: string]: { [key: string]: string } }
}

interface KeyFrames {
    [key: string]: string
}

export type IframePage = 'popup' | 'offerbar' | 'offerbarFramed' | 'notification'

const iframeStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `435px`,
            borderRadius: '8px',
            display: 'block',
            top: '10px'
        }
    },
    argent: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '360px',
            height: `600px`,
            borderRadius: '0px',
            display: 'block',
            top: '10px'
        }
    }
}

const offerbarStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '93px',
            height: `482px`,
            borderRadius: '100px 0 0 100px',
            display: 'block',
            top: '190px',
            right: '0px'
        }
    }
}

const offerbarFramedStyle: Styles = {
    default: {
        iframe: {
            position: 'fixed',
            inset: '0',
            animation: 'slideIn .3s ease-in-out',
            height: '100vh',
            width: `100vw`,
            borderRadius: '0px',
        }
    }
}

const notificationIframeStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `56px`,
            borderRadius: '10px',
            display: 'block',
            top: '40px'
        }

    },
    argent: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '400px',
            height: `50px`,
            borderRadius: '10px',
            display: 'block',
            top: '40px'
        }
    }
}

export const keyFrames: KeyFrames[] =
    [
        {
            name: 'slideIn',
            rules:
                `from {
        right: -300px;
      }
      to {
        right: 8px;
      }`
        }
    ]

const styleMap: Record<IframePage, Styles> = {
    popup: iframeStyle,
    offerbar: offerbarStyle,
    offerbarFramed: offerbarFramedStyle,
    notification: notificationIframeStyle,
}

/**
 * Returns the merged iframe style for a given page type and platform.
 * Combines the hardcoded base style with any theme-provided overrides.
 */
export const getIframeStyle = (
    page: IframePage,
    platformName: string,
    themeIframeStyle?: Record<string, string>
): { [key: string]: { [key: string]: string } } => {
    const styles = styleMap[page]
    const baseIframeStyle = styles[platformName.toLowerCase()] || styles['default']
    if (!themeIframeStyle) return baseIframeStyle
    return {
        iframe: {
            ...baseIframeStyle.iframe,
            ...themeIframeStyle
        }
    }
}