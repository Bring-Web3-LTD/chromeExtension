
interface Styles {
    [key: string]: { [key: string]: string }
}

interface KeyFrames {
    [key: string]: string
}

export const iframeStyle: Styles = {
    default: {
        animation: 'slideIn .3s ease-in-out',
        width: '480px',
        height: `435px`,
        borderRadius: '8px',
        display: 'block',
        top: '10px'
    },
    argent: {
        animation: 'slideIn .3s ease-in-out',
        width: '360px',
        height: `600px`,
        borderRadius: '0px',
        display: 'block',
        top: '10px'
    }
}

export const notificationIframeStyle: Styles = {
    default: {
        animation: 'slideIn .3s ease-in-out',
        width: '480px',
        height: `56px`,
        borderRadius: '10px',
        display: 'block',
        top: '40px'
    },
    argent: {
        animation: 'slideIn .3s ease-in-out',
        width: '400px',
        height: `50px`,
        borderRadius: '10px',
        display: 'block',
        top: '40px'
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