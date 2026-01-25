type WalletAddress = string | undefined

type Endpoint = 'sandbox' | 'prod';

type IFrame = HTMLIFrameElement | null

interface Style {
    [key: string]: string
}

interface StyleObject {
    [key: string]: { [key: string]: string }
}

interface KeyFrame {
    name: string
    rules: string
}

// Placement configuration for iframe injection
interface PlacementConfig {
    location: 'end' | 'start' | 'after' | 'before'
    selector?: string  // Required for 'after' and 'before' types
    parent?: string  // Optional parent element type (e.g., 'div')
}

interface BringEvent {
    data: {
        from: string
        action: string
        style?: StyleObject
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
        searchTermPattern?: string,
        type?: string | string[],
        quietDomainType?: string, 
        isRegex?: boolean | boolean[]
    }
}