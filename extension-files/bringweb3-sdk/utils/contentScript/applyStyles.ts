const applyStyles = (element: HTMLElement | null, style: Style | undefined) => {
    if (!element || !style || !Object.keys(style).length) return;

    Object.entries(style).forEach(([key, value]) => {
        if (key in element.style) {
            (element.style as any)[key] = value;
        }
    });
}

export default applyStyles;