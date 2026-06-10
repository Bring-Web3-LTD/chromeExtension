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

// Server-defined navigation watcher. Mirrors `IncomingFollowup` in
// utils/background/followups.ts (duplicated here because this ambient .d.ts
// can't import without becoming a module and losing its global declarations).
interface Followup {
    id: string
    ctl: { type: 't' | 'f', scope: 'tab' | 'browser', regex: string, cnt: number }
    ttl: number      // duration in ms
    trigger: string  // regex (reverse-host compressed)
    meta?: string    // opaque server context, echoed back on fire
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
        followups?: Followup[]
    }
}
type ScaleOptions = 'w' | 'h' | 'n'

interface Scales {
    x: [ScaleOptions, string]
    y: [ScaleOptions, string]
}

interface FrameModeOptions {
    scroller: string | null
    sides: [number, number, number, number]
    scales: Scales
    resize: boolean
}