/**
 * Create a specific regex pattern for search queries (Google, Amazon, etc.)
 * This converts a general pattern like "google\.com/search\?.*(shoes|flights|hotels)"
 * into a specific pattern like "google\.com/search\?.*q=shoes(\b|[^&]*)"
 * 
 * @param url - The full URL from the user's browser (e.g., "https://google.com/search?q=shoes&other=params")
 * @param generalDomain - The general regex pattern that matched (e.g., "google\.com/search\?.*(shoes|flights)")
 * @returns A specific regex pattern matching only the current search term, or the original domain if not a regex
 */
const createSpecificQuietDomain = (url: string, generalDomain: string): string => {
    try {
        const urlObj = new URL(url)
        const searchParams = urlObj.searchParams
        
        // Extract domain and path from generalDomain
        const slashIndex = generalDomain.indexOf('/')
        if (slashIndex === -1) {
            // Not a path-based pattern, return as-is
            return generalDomain
        }
        
        const domainPart = generalDomain.substring(0, slashIndex)
        const pathPart = generalDomain.substring(slashIndex)
        
        // Check if this is a search pattern (contains query parameters)
        // Look for common search parameter names
        const searchParam = searchParams.get('q') || searchParams.get('k') || searchParams.get('search')
        
        if (!searchParam) {
            // No search parameter found, return original
            return generalDomain
        }
        
        // Escape special regex characters in the search term
        const escapedSearchTerm = searchParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        
        // Determine which search parameter was used
        let paramName = 'q'
        if (searchParams.has('k')) paramName = 'k'
        if (searchParams.has('search')) paramName = 'search'
        
        // Build a specific pattern that matches any search containing this term
        // Pattern: domain/path?.*[?&]paramName=[^&]*searchTerm[^&]*
        // This will match searches that contain the term anywhere in the query
        const specificPattern = `${domainPart}${pathPart.split('.*')[0]}.*[?&]${paramName}=[^&]*${escapedSearchTerm}[^&]*`
        
        return specificPattern
    } catch (error) {
        // If URL parsing fails, return the original domain
        return generalDomain
    }
}

export default createSpecificQuietDomain
