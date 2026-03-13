import insertScroller from "./insertScroller"
import resizePage from "./resizePage"

const injectFramedIframe = ({ scroller, sides, scales, resize }: FrameModeOptions) => {

    insertScroller({ parent: scroller, id: 'bringweb3-scroller' });

    resizePage({
        sides: sides,
        scales: scales,
        listener: resize
    });
}

export default injectFramedIframe;