import { contentScriptCleanup } from "./cleanupManager";

const insertStyleElement = (css: string | undefined, id: string) => {
    if (!css) return;
    // check if stylesheet already exists, if so, remove it
    const existingStylesheet = document.getElementById(id);

    if (existingStylesheet) existingStylesheet.remove();

    const styleElement = document.createElement('style');

    styleElement.id = id;
    styleElement.textContent = css;

    document.head.appendChild(styleElement);

    // Return cleanup function
    contentScriptCleanup.add(() => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
}

export default insertStyleElement;