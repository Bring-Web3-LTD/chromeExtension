const DEFAULT_FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
const DEFAULT_FONT_FAMILY = "'Poppins', sans-serif"

const loadFont = async (fontUrl: string | null, fontFamily: string | null) => {
  const link = document.createElement('link');
  link.href = decodeURIComponent(fontUrl || DEFAULT_FONT_URL);
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Wait for the font to load
  await new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve; // Resolve even on error to prevent hanging
  });

  const style = document.createElement('style');
  style.textContent = `
      * {
        font-family: ${decodeURIComponent(fontFamily || DEFAULT_FONT_FAMILY)};
      }
    `;
  document.head.appendChild(style);

  return { link, style };
};

export default loadFont;