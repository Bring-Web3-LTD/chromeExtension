interface Styles {
    [key: string]: { [key: string]: { [key: string]: string } }
}

export const offerLineIframeStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '100vw',
            maxWidth: '100%',
            height: `41px`,
            borderRadius: '0',
            display: 'flex',
            position: 'fixed',
            top: '0',
            left: '0',
            right: 'auto',
            boxShadow: '0 3px 3px 0 rgba(0, 0, 0, 0.50)'
        },
        parent: {
            height: '41px'
        }
    }
}
