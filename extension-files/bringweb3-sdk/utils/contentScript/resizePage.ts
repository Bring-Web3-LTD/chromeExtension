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

    let originals: { prop: typeof MANAGED_PROPS[number]; value: string; priority: string }[] | null = null;

    const handleResize = () => {
        const body = document.body;
        if (!body) return;

        if (!originals) {
            originals = MANAGED_PROPS.map(prop => ({
                prop,
                value: body.style.getPropertyValue(prop),
                priority: body.style.getPropertyPriority(prop),
            }));
        }

        const availableWidth = window.innerWidth - horizontalFrame;
        const availableHeight = window.innerHeight - verticalFrame;

        const updates: Record<typeof MANAGED_PROPS[number], string> = (availableWidth <= 0 || availableHeight <= 0)
            ? {
                width: '0px',
                height: '0px',
                transform: `translate(${left}px, ${top}px) scale(0)`,
            }
            : (() => {
                const neededScaleX = horizontalFrame > 0 ? availableWidth / window.innerWidth : 1;
                const neededScaleY = verticalFrame > 0 ? availableHeight / window.innerHeight : 1;
                const scale = Math.min(neededScaleX, neededScaleY);

                return {
                    width: `${availableWidth / scale}px`,
                    height: `${availableHeight / scale}px`,
                    transform: `translate(${left}px, ${top}px) scale(${scale})`,
                };
            })();

        for (const prop of MANAGED_PROPS) {
            body.style.setProperty(prop, updates[prop], 'important');
        }
    };

    if (document.body) {
        handleResize();
    } else {
        document.addEventListener('DOMContentLoaded', handleResize, { once: true });
    }

    if (listener) {
        window.addEventListener('resize', handleResize);
    }

    contentScriptCleanup.add(() => {
        document.removeEventListener('DOMContentLoaded', handleResize);
        if (listener) {
            window.removeEventListener('resize', handleResize);
        }

        const body = document.body;
        if (!body || !originals) return;

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