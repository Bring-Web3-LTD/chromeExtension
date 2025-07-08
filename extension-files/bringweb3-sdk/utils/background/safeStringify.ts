const safeStringify = (value: any): string => {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'number') {
        if (Number.isNaN(value)) return 'NaN'
        return String(value)
    }
    if (typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) {
        return `[${value.map(item => {
            if (item === undefined) return 'undefined'
            if (item === null) return 'null'
            return safeStringify(item)
        }).join(', ')}]`
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, (_, val) => {
                if (val === undefined) return 'undefined'
                if (Number.isNaN(val)) return 'NaN'
                return val
            })
        } catch {
            return `{object: ${Object.prototype.toString.call(value)}}`
        }
    }
    return String(value)
}

export default safeStringify;