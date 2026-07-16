declare global {

    interface TestVariant {
        testName: string
        variant: string
    }

    declare enum ACTIONS {
        OPEN = 'OPEN',
        CLOSE = 'CLOSE',
        ACTIVATE = 'ACTIVATE',
        PROMPT_LOGIN = 'PROMPT_LOGIN',
        OPT_OUT = 'OPT_OUT',
        OPT_OUT_SPECIFIC = 'OPT_OUT_SPECIFIC',
        ADD_KEYFRAMES = 'ADD_KEYFRAMES',
        ERASE_NOTIFICATION = 'ERASE_NOTIFICATION',
        OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
        STOP_REMINDERS = 'STOP_REMINDERS'
    }

    interface Styles {
        [key: string]: { [key: string]: { [key: string]: string } }
    }

    type WalletAddress = string | undefined

    interface Info {
        walletAddress: WalletAddress
        platformName: string
        displayPlatformName?: string
        platformId: number
        retailerId: string
        retailerDomain: string
        name: string
        displayName: string
        maxCashback: string
        cashbackSymbol: string
        cashbackCurrency: string
        backgroundColor: string
        retailerTermsUrl: string
        topGeneralTermsUrl: string
        generalTermsUrl: string
        cryptoSymbols: string[]
        iconUrl: string
        url: string
        domain: string,
        quietDomainType: string,
        isRegex: boolean,
        searchEngineDomain?: string
        flowId: string
        isTester?: boolean
        searchTermPattern?: string,
        isOfferBar?: boolean
        offerText?: string
        offerTextTb?: string
        networkUrl?: string
        offerBarSearch?: string
        offerBarPageUrl?: string
        verifiedMatch?: {
            match: string
            isRegex: boolean
        }
        inlineSearchLink?: string
        matchedKeyword?: string
        activationPayload?: ActivateResponse | null
        timeout?: number
        followups?: any[]
        zIndex?: number
        isWidgetEnabled?: boolean
    }

    interface LoaderData extends Info {
        iconsPath: string
        themeMode: 'light' | 'dark'
        textMode: 'upper' | 'lower'
        testVariants: TestVariant[]
        switchWallet: boolean
        userId: string
        version: string
        networkUrl: string
        beamer: boolean
        iframeStyle?: Record<string, string>
    }

    interface ActivatedData extends Info {
        tokenSymbol: string
        iconsPath: string
        version: string
    }

    interface Message {
        action?: ACTIONS
        time?: number
        style?: unknown
        id?: string
        keyFrames?: unknown
        key?: string
        url?: string
        domain?: string | string[]
        redirectUrl?: string
        iframeUrl?: string
        token?: string
        flowId?: string
        platformName?: string
        searchTermPattern?: string
        offerlineDomain?: string,
        quietDomainType?: string,
        type?: string | string[], 
        isRegex?: boolean | boolean[]
        followups?: any[]
    }

    interface AnalyticsContextType {
        sendAnalyticsEvent: (name: EventName, event: AnalyticsEvent) => Promise<void>;
    }

    interface WalletAddressContextType {
        walletAddress: string | undefined;
        setWalletAddress: (address: string | undefined) => void;
    }
}

export { }