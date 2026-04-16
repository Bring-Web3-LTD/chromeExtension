const DEFAULT_FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
const DEFAULT_FONT_FAMILY = "'Poppins', sans-serif"
const INTER_FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

const loadFont = async (fontUrl: string | null, fontFamily: string | null) => {
  const resolvedUrl = fontUrl || DEFAULT_FONT_URL;

  // Load the theme's main font
  const link = document.createElement('link');
  link.href = resolvedUrl;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  const fontPromises: Promise<unknown>[] = [
    new Promise((resolve) => { link.onload = resolve; link.onerror = resolve; })
  ];

  // Load Inter for TB (framed) components — skip if the theme already uses Inter
  if (resolvedUrl !== INTER_FONT_URL) {
    const interLink = document.createElement('link');
    interLink.href = INTER_FONT_URL;
    interLink.rel = 'stylesheet';
    document.head.appendChild(interLink);
    fontPromises.push(
      new Promise((resolve) => { interLink.onload = resolve; interLink.onerror = resolve; })
    );
  }

  await Promise.all(fontPromises);

  const style = document.createElement('style');
  style.textContent = `
      * {
        font-family: ${fontFamily || DEFAULT_FONT_FAMILY};
      }
    `;
  document.head.appendChild(style);

  return { link, style };
};

export default loadFont;