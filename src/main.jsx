import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import Enroll from './pages/public/Enroll'
import Acceso from './pages/public/Acceso'
import Reclamos from './pages/public/Reclamos'
import Legal from './pages/public/Legal'
import { ToastProvider } from './context/ToastContext'

const PUBLIC = { '/enroll': Enroll, '/acceso': Acceso, '/reclamos': Reclamos, '/legal': Legal }
const Page = PUBLIC[window.location.pathname]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {Page ? <Page /> : (
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    )}
  </StrictMode>,
)
