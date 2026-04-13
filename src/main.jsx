/**
 * ============================================
 * Punto de Entrada - Main
 * Sistema Francisco - Estilo Apple/Mac
 * ============================================
 */

// React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// third-party - Bootstrap 5 + Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Estilos del Sistema - Orden específico
import './styles/variables.css'      // Custom properties
import './styles/colors.css'          // Paleta de colores
import './styles/typography.css'        // Tipografía
import './styles/utilities.css'        // Utilidades
import './styles/components.css'       // Componentes
import './styles/glassmorphism.css'  // Diseño glass (opcional)

// App
import App from './App.jsx'

// Mount
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)