/**
 * Generates initials from a retailer name (max 2 letters)
 * If name has multiple words, takes first letter of first two words
 * Otherwise takes first two letters of the name
 * @param name - The retailer name
 * @returns Uppercase initials (1-2 characters)
 */
export const getInitials = (name: string): string => {
    if (!name) return ''
    
    const trimmed = name.trim()
    const words = trimmed.split(/\s+/).filter(word => word.length > 0)
    
    if (words.length >= 2) {
        // Multiple words: first letter of first two words
        return (words[0][0] + words[1][0]).toUpperCase()
    } else {
        // Single word: first letter
        return trimmed.substring(0, 1).toUpperCase()
    }
}
