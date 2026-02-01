import { contentScriptCleanup } from "./cleanupManager";

interface Options {
    parent: string | null
    id: string
}


/**
 * Inserts a scroller div inside a parent element and moves all existing children into it.
 *
 * @param {Options} param0 
 * @param {string} param0.parent 
 * @param {string} param0.id 
 * @returns {Function | undefined} Cleanup function to remove the scroller and restore original children
 */
const insertScroller = ({ parent, id }: Options) => {
    if (!parent) return;
    
    const parentElement = document.querySelector(parent);

    if (!parentElement) return;
    // Create scroller div
    const scroller = document.createElement('div');
    
    scroller.id = id;
    
    // Move existing children into scroller
    while (parentElement.firstChild) {
        scroller.appendChild(parentElement.firstChild);
    }

    // Append scroller to parent
    parentElement.appendChild(scroller);

    // cleanup function
    contentScriptCleanup.add(() => {
        const existingScroller = document.getElementById(id);
        if (existingScroller && existingScroller.parentElement) {
            // Move children back to parent
            while (existingScroller.firstChild) {
                existingScroller.parentElement.appendChild(existingScroller.firstChild);
            }
            // Remove the scroller
            existingScroller.remove();
        }
    });
}

export default insertScroller;