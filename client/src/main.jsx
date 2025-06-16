import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/main.css'
import App from './App.jsx'
import { UserPreferencesProvider } from './context/UserPreferencesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserPreferencesProvider>
      <App />
    </UserPreferencesProvider>
  </StrictMode>,
)