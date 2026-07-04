import '@vitejs/plugin-react/preamble'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import type { InitialData } from './types'

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData
  }
}

hydrateRoot(
  document.querySelector('#app')!,
  <AuthProvider>
    <App initialData={window.__INITIAL_DATA__} />
  </AuthProvider>,
)
