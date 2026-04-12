/**
 * ============================================
 * Punto de Entrada - Main
 * Sistema Francisco
 * ============================================
 */

// React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// third-party - Bootstrap 5 + Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Diseño del Sistema - Orden específico
import './styles/variables.css'     // Custom properties primero
import './styles/typography.css'   // Tipografía
import './styles/utilities.css'  // Utilidades
import './styles/glassmorphism.css' // Diseño glass
import './styles/components.css'  // Componentes

// App
import App from './App.jsx'

// Mount
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)