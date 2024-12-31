import { VariantKey } from "./utils/ABTest/ABTestVariant"
declare global {

    declare enum ACTIONS {
        OPEN = 'OPEN',
        CLOSE = 'CLOSE',
        ACTIVATE = 'ACTIVATE',
        PROMPT_LOGIN = 'PROMPT_LOGIN',
        OPT_OUT = 'OPT_OUT',
        ADD_KEYFRAMES = 'ADD_KEYFRAMES',
        ERASE_NOTIFICATION = 'ERASE_NOTIFICATION',
        OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE'
    }

    interface Styles {
        [key: string]: string
    }

    type WalletAddress = string | undefined

    interface Info {
        walletAddress: WalletAddress
        platformName: string
        retailerId: string
        name: string
        maxCashback: string
        cashbackSymbol: string
        cashbackCurrency: string
        backgroundColor: string
        retailerTermsUrl: string
        generalTermsUrl: string
        cryptoSymbols: string[]
        iconUrl: string
        url: string
    }

    interface LoaderData extends Info {
        iconsPath: string
        themeMode: 'light' | 'dark'
        textMode: 'upper' | 'lower'
        variant: VariantKey
        switchWallet: boolean
        userId: string | undefined
    }

    interface Message {
        action?: ACTIONS
        time?: number
        style?: Styles
        id?: string
        keyFrames?: Styles[]
        key?: string
        url?: string
    }

    interface GoogleAnalyticsContextType {
        sendGaEvent: (name: EventName, event: GAEvent, disableGA?: boolean) => void;
        sendPageViewEvent: (path: string) => void;
    }
}

export { }