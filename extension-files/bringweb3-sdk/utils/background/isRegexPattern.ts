/**
 * Check if a domain string contains regex special characters
 * Used to determine if a domain pattern should be treated as a regex
 */
const isRegexPattern = (domain: string): boolean => {
    if (!domain) return false
    
    // Check for common regex special characters
    return domain.includes('\\') || 
           domain.includes('(') || 
           domain.includes('|') || 
           domain.includes('*') || 
           domain.includes('?') || 
           domain.includes('[') || 
           domain.includes(']')
}

export default isRegexPattern
