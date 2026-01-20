import { contentScriptCleanup } from "./cleanupManager";

interface ResizePageOptions {
    sides: [number, number, number, number] // top, right, bottom, left
    scales: Scales,
    listener: boolean
}

const getScale = (scale: ScaleOptions, offset: number): number => {
    if (scale === 'w') return (window.innerWidth - offset) / window.innerWidth;
    if (scale === 'h') return (window.innerHeight - offset) / window.innerHeight;
    return 1;
}

const sumSides = (sidesToSum: string, sides: number[]): number => {
    return sidesToSum.split('').reduce((acc, value) => acc + (sides[parseInt(value)] ?? 0), 0);
}

const resizePage = ({ sides, scales, listener }: ResizePageOptions) => {
    // Ensure no negative sides
    sides.forEach((side, index) => { sides[index] = Math.max(0, side) });

    const handleResize = () => {
        const body = document.body;
        const newScaleX = getScale(scales.x[0], sumSides(scales.x[1], sides));
        const newScaleY = getScale(scales.y[0], sumSides(scales.y[1], sides));
        console.table({ newScaleX, newScaleY, height: body.style.height });

        body.style.setProperty(
            'transform',
            `translate(${sides[3]}px, ${sides[0]}px) scale(${newScaleX}, ${newScaleY})`,
            'important'
        );
        
        body.style.setProperty(
            'height',
            `calc(100vh / ${newScaleY})`,
            'important'
        );
    };

    // Apply initial sizing
    handleResize();

    if (listener) {
        // Add resize listener
        window.addEventListener('resize', handleResize);
    }

    // Return cleanup function
    if (listener) {
        contentScriptCleanup.add(() => {
            window.removeEventListener('resize', handleResize);
        });
    }
}

export default resizePage;