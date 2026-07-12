import { useEffect, FC, useRef } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useRouteLoaderData } from 'react-router-dom';

interface BeamerProps {
    enabled?: boolean;
}

const Beamer: FC<BeamerProps> = ({ enabled = false }) => {
    const { sendAnalyticsEvent } = useAnalytics();
    const { url } = useRouteLoaderData('root') as LoaderData;
    const pingCountRef = useRef(0);
    const lastMouseMoveRef = useRef<number>(Date.now());
    const isTabVisibleRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        const handleVisibilityChange = () => {
            isTabVisibleRef.current = document.visibilityState === 'visible';
        };

        const handleMouseMove = () => {
            lastMouseMoveRef.current = Date.now();
        };

        const beam = () => {
            if (mounted) {
                pingCountRef.current += 1;
                const parentLocation = url;
                const timeSinceLastMouseMove = Date.now() - lastMouseMoveRef.current;

                sendAnalyticsEvent('beamer', {
                    pingNumber: pingCountRef.current,
                    category: 'system',
                    parentLocation,
                    isTabActive: isTabVisibleRef.current,
                    lastMouseMoveMs: timeSinceLastMouseMove
                });
            }
        };

        // Set up event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', handleMouseMove);

        // Initial state
        isTabVisibleRef.current = document.visibilityState === 'visible';

        beam();
        const intervalId = setInterval(beam, 5000);

        return () => {
            mounted = false;
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', handleMouseMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export default Beamer;