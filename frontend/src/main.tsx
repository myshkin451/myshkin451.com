import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PlatformProvider } from './platform'
import App from './App'
import { ConfirmProvider } from './Confirm'
import './global.css'
import './public.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </PlatformProvider>
  </StrictMode>,
)
