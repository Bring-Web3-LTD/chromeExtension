interface Helpers {
    [key: string]: {
        get: (...args: any[]) => any;
        set: (...args: any[]) => any;
    }
}

export const strToUint8Array = (str: string): Uint8Array | null => {
    try {
        const decoded = atob(str);
        const arr = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            arr[i] = decoded.charCodeAt(i);
        }
        return arr;
    } catch (error) {
        return null
    }
}

export const uint8ArrayToStr = (blob: Uint8Array): string => {
    const arr = [];
    for (let i = 0; i < blob.length; i += 1000) {
        const next = Math.min(i + 1000, blob.length)
        arr.push(String.fromCharCode(...blob.slice(i, next)))
    }
    return btoa(arr.join(''))
}

const helpers: Helpers = {
    relevantDomains: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    },
    redirectsWhitelist: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    },
    portalRelevantDomains: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    },
    postPurchaseUrls: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    },
    flags: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    },
    domainsTypes: {
        get: (str: string) => JSON.parse(str),
        set: (arr: string[]) => JSON.stringify(arr)
    }
}

export default helpers;