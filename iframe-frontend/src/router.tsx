import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout/Layout.tsx'
import Home from './pages/Home/Home.tsx'
import Notification from './pages/Notification/Notification.tsx'
import rootLoader from './utils/loaders/rootLoader.ts'
import removeTrailingSlash from './utils/removeTrailingSlash.ts'
import { BASE_PATH } from './config.ts'
import Activated from './pages/Activated/Activated.tsx'

const router = createBrowserRouter([
    {
        element: <Layout />,
        loader: rootLoader,
        id: "root",
        errorElement: <></>,
        shouldRevalidate: () => false,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: '/notification',
                element: <Notification />
            },
            {
                path: '/activated',
                element: <Activated />
            }
        ],
    },
], {
    basename: removeTrailingSlash(BASE_PATH)
});

export default router;