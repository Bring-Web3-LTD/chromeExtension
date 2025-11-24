interface Helpers {
    [key: string]: {
        get: (...args: any[]) => any;
        set: (...args: any[]) => any;
    }
}

export const strToUint8Array = (str: string): Uint8Array | null => {
    try {
        return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)))
    } catch (error) {
        return null
    }
}

export const uint8ArrayToStr = (blob: Uint8Array): string => {
    // Process in chunks to avoid "Maximum call stack size exceeded" error
    // when dealing with large Uint8Arrays (e.g., 77KB domain lists)
    const CHUNK_SIZE = 8192; // 8KB chunks - safe for all browsers
    let binaryString = '';
    
    for (let i = 0; i < blob.length; i += CHUNK_SIZE) {
        const chunk = blob.subarray(i, i + CHUNK_SIZE);
        binaryString += String.fromCharCode(...chunk);
    }
    
    return btoa(binaryString);
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
    postPurchaseUrls: {
        get: strToUint8Array,
        set: uint8ArrayToStr
    }
}

export default helpers;