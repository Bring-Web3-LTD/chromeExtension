import { createBrowserRouter } from 'react-router-dom'
import Go from './pages/Go/Go.tsx'
import Start from './pages/Start/Start.tsx'
import Embed from './pages/Embed/Embed.tsx'
import NotFound from './pages/NotFound.tsx'

const router = createBrowserRouter([
    {
        // Any unknown path (including "/") lands here instead of the router's developer error page
        errorElement: <NotFound />,
        children: [
            {
                path: '/go',
                element: <Go />
            },
            {
                path: '/start',
                element: <Start />
            },
            {
                path: '/embed',
                element: <Embed />
            }
        ]
    }
], {
    basename: (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '')
});

export default router;
