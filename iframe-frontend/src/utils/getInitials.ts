/**
 * Generates initials from a name (1-2 uppercase letters from first two words)
 * @param name - The retailer name
 * @returns Uppercase initials
 */
export const getInitials = (name: string): string => {
    if (!name) return ''
    
    const trimmed = name.trim()
    const words = trimmed.split(/\s+/).filter(word => word.length > 0)
    
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
