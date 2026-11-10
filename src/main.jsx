import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'


createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="TROCAR-AUTH0-DOMAIN"
      clientId="TROCAR-AUTH0-CLIENT-ID"
      authorizationParams={{
        audience: "TROCAR-AUTH0-AUDIENCE",
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)