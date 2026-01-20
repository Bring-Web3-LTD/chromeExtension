export const getStylesheet = ({ sides, iframeId }: { sides: number[], iframeId: string }) => {
    const config = {
        sides,
        imageUrl: 'https://www.bringweb3.com/assets/images/frame-mask-pattern.png'
    }
    return `html {
    overflow: hidden !important;
    height: 100vh !important;
    width: 100vw !important;
    scrollbar-gutter: auto !important;
}

body {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    overflow: hidden !important;
    transform-origin: top left !important;
}

#bringweb3-scroller {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: auto;
    position: relative;
}

#${iframeId} {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483647;
    pointer-events: none;
    background-image: url("${config.imageUrl}");
    background-size: 50px;
    background-repeat: repeat;
    background-position: center;
    -webkit-mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    box-sizing: border-box;
    padding: ${config.sides.map(side => `${side}px`).join(' ')};
}`
}