interface CleanupManager {
    add: (cleanup?: (() => void) | undefined) => void;
    cleanup: () => void;
}

/**
 * Creates a cleanup manager to handle multiple cleanup functions.
 * Useful for managing lifecycle of multiple DOM elements, event listeners, etc.
 * 
 * @returns {CleanupManager} Object with add and cleanup methods
 * 
 * @example
 * const manager = createCleanupManager();
 * manager.add(insertStyleElement(css, 'my-styles'));
 * manager.add(resizePage({ element, sides, scales }));
 * 
 * // Later, clean up everything
 * manager.cleanup();
 */
export const createCleanupManager = (): CleanupManager => {
    const cleanups: Array<() => void> = [];
    
    return {
        /**
         * Adds a cleanup function to the manager
         * @param cleanup - Optional cleanup function to register
         */
        add: (cleanup?: (() => void) | undefined) => {
            if (cleanup) {
                cleanups.push(cleanup);
            }
        },
        
        /**
         * Executes all registered cleanup functions and clears the list
         */
        cleanup: () => {
            cleanups.forEach(fn => {
                try {
                    fn();
                } catch (error) {
                    console.error('Cleanup function failed:', error);
                }
            });
            cleanups.length = 0;
        }
    };
};

/**
 * Global cleanup manager instance for the content script.
 * Import this to add cleanup functions from anywhere in your content script.
 * 
 * @example
 * // In any file
 * import { contentScriptCleanup } from './utils/contentScript/cleanupManager';
 * 
 * contentScriptCleanup.add(insertStyleElement(css, 'my-styles'));
 * 
 * // Later, from anywhere
 * contentScriptCleanup.cleanup();
 */
export const contentScriptCleanup = createCleanupManager();

export default createCleanupManager;
