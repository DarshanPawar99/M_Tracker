import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './store'
import { SessionProvider } from './session'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
