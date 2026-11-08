import { createBrowserRouter } from 'react-router-dom'
import Start from './pages/Start/Start.tsx'
import Embed from './pages/Embed/Embed.tsx'

const router = createBrowserRouter([
    {
        // Any unknown path (including "/") lands here instead of the router's developer error page
        errorElement: <main><h1>Page not found</h1></main>,
        children: [
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
