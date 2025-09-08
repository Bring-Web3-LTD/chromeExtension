type WalletAddress = string | undefined

type Endpoint = 'sandbox' | 'prod';

type IFrame = HTMLIFrameElement | null

interface Style {
    [key: string]: string
}

interface KeyFrame {
    name: string
    rules: string
}

interface BringEvent {
    data: {
        from: string
        action: string
        style?: Style[]
        keyFrames?: KeyFrame[]
        extensionId: string
        time?: number
        key?: string
        url?: string
        domain?: string
        redirectUrl?: string
        iframeUrl?: string
        token?: string
        flowId?: string
        platformName?: string
    }
}