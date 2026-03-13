/**
 * Generates initials from a name (1-2 uppercase letters from first words)
 * Special characters like & are not counted as words
 * @param name - The retailer name
 * @returns Uppercase initials
 */
export const getInitials = (name: string): string => {
    if (!name) return ''
    
    const trimmed = name.trim()
    const words = trimmed.split(/\s+/)
        .filter(word => word.length > 0 && /[a-zA-Z]/.test(word))
    
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
