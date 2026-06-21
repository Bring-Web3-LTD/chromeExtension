import { getLogger } from "../logger/logger";

const log = getLogger('content');

const addKeyframes = (keyFrames: KeyFrame[] | undefined): void => {

    if (!keyFrames || !keyFrames.length) return

    const style = document.createElement('style');

    document.head.appendChild(style);

    const sheet = style.sheet;

    if (sheet) {
        keyFrames.forEach(({ name, rules }) => {
            sheet.insertRule(`@keyframes ${name} { ${rules} }`, sheet.cssRules.length);
        })
    } else {
        log.error('failed to create stylesheet');
    }
}

export default addKeyframes;