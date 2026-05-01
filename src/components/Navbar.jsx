/**
 * ============================================
 * Componente Navbar
 * Barra de navegación principal de la aplicación
 * Muestra el menú, cotización del dólar y controls de usuario
 * ============================================
 */

// React Router - Navegación
import { Link, useLocation } from 'react-router-dom';

// Context - Autenticación y Cotización
import { useAuth } from '../context/AuthContext';
import { useDollar } from '../context/DollarContext';

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API
import { alertaService } from '../services/api';

/**
 * Componente de Barra de Navegación
 * @description Muestra el menú de navegación, la cotización actual del dólar
 * y controls para cerrar sesión. Actualiza las alertas cada 60 segundos.
 * @returns {JSX.Element} Barra de navegación
 */
const Navbar = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Context de autenticación
  const { user, logout } = useAuth();
  
  // Context de cotización del dólar
  const { cotizacionDolar } = useDollar();
  
  // Hook de ubicación actual (react-router)
  const location = useLocation();
  
  // Nombre de la tienda (desde localStorage)
  const [nombreTienda] = useState(() => {
    return localStorage.getItem('nombreTienda') || 'Stock Nextech';
  });
  
  // Contador de alertas de stock
  const [alertasCount, setAlertasCount] = useState(0);

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Fetch de alertas
   * @description Carga las alertas de stock cada 60 segundos si hay un usuario logueado
   */
  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const res = await alertaService.getActivas();
        setAlertasCount(res.data.length);
      } catch (err) {
        console.error(err);
      }
    };
    
    if (user) {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ============================================
  // Datos - Definiciones estáticas
  // ============================================

  // Elementos del menú de navegación
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { path: '/nueva-venta', label: 'Nueva Venta', icon: 'cart', primary: true },
    { path: '/productos', label: 'Productos', icon: 'box' },
    { path: '/movimientos', label: 'Movimientos', icon: 'arrow-left-right' },
    { path: '/caja', label: 'Caja', icon: 'cash-coin' },
    { path: '/proveedores', label: 'Proveedores', icon: 'truck' },
    { path: '/clientes', label: 'Clientes', icon: 'people' }
  ];

  // Elementos de administrador
  const adminItems = [
    { path: '/ppconfig', label: 'Valores PP', icon: 'phone' },
    { path: '/usuarios', label: 'Usuarios', icon: 'person-gear' }
  ];

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <nav className="glass-navbar navbar navbar-expand-lg">
      <div className="container-fluid">
        {/* Logo/Nombre de la tienda */}
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <i className="bi bi-box-seam me-2"></i>
          {nombreTienda}
        </Link>
        
        {/* Botón hamburguesa para móvil */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Menú de navegación */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Items del menú principal */}
            {user && navItems.map(item => (
              <li className="nav-item" key={item.path}>
                <Link 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''} ${item.primary ? 'nav-cta' : ''}`}
                  to={item.path}
                >
                  <i className={`bi bi-${item.icon}${item.primary ? '' : '-fill'} me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Items de administrador */}
            {user?.rol === 'admin' && adminItems.map(item => (
              <li className="nav-item" key={item.path}>
                <Link 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  to={item.path}
                >
                  <i className={`bi bi-${item.icon}-fill me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Separador para controles de usuario en móvil */}
            <li className="nav-item d-lg-none">
              <hr className="my-2" />
            </li>
            
            {/* Controls de usuario - visibles en desktop */}
            <li className="nav-item d-none d-lg-block">
              <div className="navbar-user-section">
                <span className="dollar-badge">
                  <i className="bi bi-currency-dollar"></i>
                  USD: {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
                </span>
                {alertasCount > 0 && (
                  <Link 
                    to="/alertas" 
                    className="navbar-alerts-btn position-relative"
                  >
                    <i className="bi bi-bell-fill"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {alertasCount}
                    </span>
                  </Link>
                )}
                <div className="navbar-divider"></div>
                <span className="navbar-user-name">
                  <i className="bi bi-person-circle"></i>
                  {user.nombre || user.username}
                </span>
                <button 
                  className="glass-btn btn btn-sm" 
                  onClick={logout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  <span className="d-none d-xl-inline">Cerrar Sesión</span>
                </button>
              </div>
            </li>
          </ul>
          
          {/* Controls de usuario para móvil - dentro del menú */}
          <div className="d-lg-none mobile-section">
            <div className="d-flex flex-column gap-2">
              <div className="dollar-badge px-3 py-2 mx-3">
                <i className="bi bi-currency-dollar me-2"></i>
                USD: {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
              </div>
              {alertasCount > 0 && (
                <Link 
                  to="/alertas" 
                  className="navbar-alerts-btn mx-3"
                >
                  <i className="bi bi-bell-fill me-2"></i>
                  Alertas
                  <span className="badge bg-danger ms-2">{alertasCount}</span>
                </Link>
              )}
              <div className="navbar-user-name px-3 py-2 mx-3">
                <i className="bi bi-person-circle me-2"></i>
                {user.nombre || user.username}
              </div>
              <button 
                className="glass-btn btn btn-sm mx-3" 
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
