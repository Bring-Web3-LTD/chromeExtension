interface Styles {
    [key: string]: { [key: string]: string }
}

export const offerLineIframeStyle: Styles = {
    default: {
        animation: 'slideIn .3s ease-in-out',
        width: '480px',
        height: `550px`,
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
