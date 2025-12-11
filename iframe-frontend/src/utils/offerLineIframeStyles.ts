interface Styles {
    [key: string]: { [key: string]: string }
}

export const offerLineIframeStyle: Styles = {
    default: {
        animation: 'slideIn .3s ease-in-out',
        width: '100vw',
        maxWidth: '100%',
        height: `67px`,
        borderRadius: '0',
        display: 'flex',
        position: 'static',
        right: 'auto'
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
