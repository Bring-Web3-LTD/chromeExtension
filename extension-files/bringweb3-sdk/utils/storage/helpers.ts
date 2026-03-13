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

const buildRegExpArray = (obj: { regexes: string[], flags: string[] }) => {
    try {
        return obj.regexes.map((pattern, i) => new RegExp(pattern, obj.flags[i] || ''))
    } catch (error) {
        console.error('Error building RegExp array:', error)
        return null
    }
}

const helpers: Helpers = {
    relevantDomains: {
        get: buildRegExpArray,
        set: buildRegExpArray
    }
}

export default helpers;