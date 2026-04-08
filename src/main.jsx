import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Iconos
import 'bootstrap-icons/font/bootstrap-icons.css'

// Estilos personalizados
import './styles/glassmorphism.css'
import './styles/components.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
