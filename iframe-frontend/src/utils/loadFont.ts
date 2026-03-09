const DEFAULT_FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
const DEFAULT_FONT_FAMILY = "'Poppins', sans-serif"

const loadFontStylesheet = (url: string): Promise<void> => {
  const link = document.createElement('link');
  link.href = url;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  return new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve();
  });
};

// Preload default font CSS at import time, in parallel with verify()
const defaultFontReady = loadFontStylesheet(DEFAULT_FONT_URL);

// Cache for eagerly started font loads
const fontPreloads = new Map<string, Promise<void>>();

/**
 * Start loading a font CSS early, before loadFont() is called.
 * Call this as soon as you know the font URL to overlap with other async work.
 */
export const preloadFontUrl = (url: string): void => {
  if (!url || url === DEFAULT_FONT_URL || fontPreloads.has(url)) return;
  fontPreloads.set(url, loadFontStylesheet(url));
};

const loadFont = async (fontUrl: string | null, fontFamily: string | null) => {
  const isDefault = !fontUrl || fontUrl === DEFAULT_FONT_URL;

  if (isDefault) {
    await defaultFontReady;
  } else {
    // Use preloaded promise if available, otherwise load now
    const preloaded = fontPreloads.get(fontUrl);
    await (preloaded || loadFontStylesheet(fontUrl));
  }

  const resolvedFamily = fontFamily || DEFAULT_FONT_FAMILY;
  const style = document.createElement('style');
  style.textContent = `* { font-family: ${resolvedFamily}; }`;
  document.head.appendChild(style);
};

export default loadFont;