import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'


createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-zan42ozc1ik07ei1.us.auth0.com"
      clientId="64owM81PeuJacIqzgqgrMqBUkwOWmHK5"
      authorizationParams={{
        audience: "https://avaliacoes-api",
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)