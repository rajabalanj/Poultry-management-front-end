import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import App from './App.tsx'
import { cognitoConfig } from './config/cognito'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import './styles/bootstrap.min.css'
import './styles/global.css';
import 'react-datepicker/dist/react-datepicker.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
