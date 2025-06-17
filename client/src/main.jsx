import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { UserPreferencesProvider } from './context/UserPreferencesContext'
import './index.css'
import './styles/main.css'
import './styles/reading-mode.css'
import './styles/preferences.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserPreferencesProvider>
      <App />
    </UserPreferencesProvider>
  </React.StrictMode>,
)