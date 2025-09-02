interface Helpers {
    [key: string]: {
        get: (...args: any[]) => any;
        set: (...args: any[]) => any;
    }
}

export const strToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)))
}

export const uint8ArrayToStr = (blob: Uint8Array): string => {
    return btoa(String.fromCharCode(...blob))
}

const helpers: Helpers = {
    relevantDomains: {
        get: strToUint8Array,
        set: uint8ArrayToStr
    },
    redirectsWhitelist: {
        get: strToUint8Array,
        set: uint8ArrayToStr
    },
    portalRelevantDomains: {
        get: strToUint8Array,
        set: uint8ArrayToStr
    },
    thankYouPages: {
        get: strToUint8Array,
        set: uint8ArrayToStr
    }
}

export default helpers;