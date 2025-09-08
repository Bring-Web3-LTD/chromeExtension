export const sendMessage = (message: Message) => {
    const searchParams = new URLSearchParams(window.location.search);
    const extensionId = searchParams.get('extensionId');
    window.parent.postMessage({ from: 'bringweb3', ...message, extensionId }, '*')
}

export enum ACTIONS {
    OPEN = 'OPEN',
    CLOSE = 'CLOSE',
    ACTIVATE = 'ACTIVATE',
    PROMPT_LOGIN = 'PROMPT_LOGIN',
    OPT_OUT = 'OPT_OUT',
    OPT_OUT_SPECIFIC = 'OPT_OUT_SPECIFIC',
    ADD_KEYFRAMES = 'ADD_KEYFRAMES',
    ERASE_NOTIFICATION = 'ERASE_NOTIFICATION',
    OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
    STOP_REMINDERS = 'STOP_REMINDERS'
}
