
const toCaseString = (str: string, mode?: 'upper' | 'lower', platformName?: string) => {

    if (platformName?.toLowerCase() === 'ecko') return str;

    if (mode !== 'upper') {
        return str
    }
    return str.toUpperCase()
}

export default toCaseString