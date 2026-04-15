import { contentScriptCleanup } from "./cleanupManager";

interface ResizePageOptions {
    sides: [number, number, number, number]; // top, right, bottom, left
    listener: boolean;
}

const MANAGED_PROPS = ['width', 'height', 'transform'] as const;

const resizePage = ({ sides, listener }: ResizePageOptions) => {
    const safeSides = sides.map(s => Math.max(0, s)) as [number, number, number, number];
    const [top, right, bottom, left] = safeSides;
    const horizontalFrame = left + right;
    const verticalFrame = top + bottom;

    const body = document.body;

    // Capture original inline values + priorities for each managed property
    const originals = MANAGED_PROPS.map(prop => ({
        prop,
        value: body.style.getPropertyValue(prop),
        priority: body.style.getPropertyPriority(prop),
    }));

    const handleResize = () => {
        const neededScaleX = horizontalFrame > 0
            ? (window.innerWidth - horizontalFrame) / window.innerWidth
            : 1;
        const neededScaleY = verticalFrame > 0
            ? (window.innerHeight - verticalFrame) / window.innerHeight
            : 1;

        const scale = Math.min(neededScaleX, neededScaleY);
        const bodyWidth = (window.innerWidth - horizontalFrame) / scale;
        const bodyHeight = (window.innerHeight - verticalFrame) / scale;

        const updates: Record<typeof MANAGED_PROPS[number], string> = {
            width: `${bodyWidth}px`,
            height: `${bodyHeight}px`,
            transform: `translate(${left}px, ${top}px) scale(${scale})`,
        };

        for (const prop of MANAGED_PROPS) {
            body.style.setProperty(prop, updates[prop], 'important');
        }
    };

    handleResize();

    if (listener) {
        window.addEventListener('resize', handleResize);
    }

    contentScriptCleanup.add(() => {
        if (listener) {
            window.removeEventListener('resize', handleResize);
        }

        for (const { prop, value, priority } of originals) {
            if (value) {
                body.style.setProperty(prop, value, priority);
            } else {
                body.style.removeProperty(prop);
            }
        }
    });
};

export default resizePage;