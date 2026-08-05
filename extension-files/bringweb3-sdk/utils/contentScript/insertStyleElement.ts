import { contentScriptCleanup } from "./cleanupManager";

const insertStyleElement = (css: string | undefined, id: string) => {
    if (!css) return;
    // check if stylesheet already exists, if so, remove it
    const existingStylesheet = document.getElementById(id);

    if (existingStylesheet) existingStylesheet.remove();

    const styleElement = document.createElement('style');

    styleElement.id = id;
    styleElement.textContent = css;

    // An INJECT arriving very early can land before <head> is parsed;
    // documentElement always exists, and a <style> outside <head> still applies.
    (document.head || document.documentElement).appendChild(styleElement);

    // Return cleanup function
    contentScriptCleanup.add(() => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
}

export default insertStyleElement;