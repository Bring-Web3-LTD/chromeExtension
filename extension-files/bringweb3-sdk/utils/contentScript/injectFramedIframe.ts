import insertScroller from "./insertScroller"
import resizePage from "./resizePage"

const injectFramedIframe = ({ scroller, sides, resize }: FrameModeOptions) => {

    insertScroller({ parent: scroller, id: 'bringweb3-scroller' });

    resizePage({
        sides: sides,
        listener: resize
    });
}

export default injectFramedIframe;