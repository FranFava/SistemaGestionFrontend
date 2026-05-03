/**
 * ============================================
 * Componente Navbar
 * Barra de navegación principal de la aplicación
 * Muestra el menú, cotización del dólar y controles de usuario
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
 * @returns {JSX.Element} Barra de navegación
 */
const Navbar = () => {
  // Context de autenticación
  const { user, logout } = useAuth();

  // Context de cotización del dólar
  const { cotizacionDolar } = useDollar();

  // Hook de ubicación actual
  const location = useLocation();

  // Contador de alertas de stock
  const [alertasCount, setAlertasCount] = useState(0);

  /**
   * Fetch de alertas cada 60 segundos
   */
  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const res = await alertaService.getActivas();
        setAlertasCount(res.data.length);
      } catch {
        /* ignore */
      }
    };

    if (user) {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Items principales del menú
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { path: '/nueva-venta', label: 'Nueva Venta', icon: 'cart-plus', primary: true },
    { path: '/productos', label: 'Productos', icon: 'box' },
    { path: '/movimientos', label: 'Movimientos', icon: 'arrow-left-right' },
    { path: '/comprobantes', label: 'Comprobantes', icon: 'receipt' },
    { path: '/stock', label: 'Stock', icon: 'box-seam' },
    { path: '/caja', label: 'Caja', icon: 'cash-coin' },
    { path: '/crm', label: 'CRM', icon: 'people' },
  ];

  // Items de administración (agrupados en dropdown)
  const adminItems = [
    { path: '/categorias', label: 'Categorías', icon: 'diagram-3' },
    { path: '/listas-precio', label: 'Listas de Precios', icon: 'tags' },
    { path: '/ppconfig', label: 'Valores PP', icon: 'phone' },
    { path: '/usuarios', label: 'Usuarios', icon: 'person-gear' },
  ];

  const isAdmin = user?.rol === 'admin';
  const isActive = (path) => location.pathname === path;
  const isActiveAdmin = adminItems.some(item => isActive(item.path));

  return (
    <nav className="glass-navbar navbar navbar-expand-lg">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <i className="bi bi-box-seam me-2"></i>
          Nextech
        </Link>

        {/* Hamburger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav content */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Navigation items */}
          <ul className="navbar-nav me-auto">
            {navItems.map(item => (
              <li className="nav-item" key={item.path}>
                <Link
                  className={`nav-link ${isActive(item.path) ? 'active' : ''} ${item.primary ? 'nav-cta' : ''}`}
                  to={item.path}
                >
                  <i className={`bi bi-${item.icon}${item.primary ? '' : '-fill'} me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Admin dropdown */}
            {isAdmin && (
              <li className="nav-item dropdown">
                <Link
                  className={`nav-link dropdown-toggle ${isActiveAdmin ? 'active' : ''}`}
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={e => e.preventDefault()}
                >
                  <i className="bi bi-gear-fill me-1"></i>
                  Administración
                </Link>
                <ul className="dropdown-menu glass-dropdown-menu">
                  {adminItems.map(item => (
                    <li key={item.path}>
                      <Link
                        className={`dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                        to={item.path}
                      >
                        <i className={`bi bi-${item.icon}-fill me-2`}></i>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>

          {/* User section - separated from nav */}
          <div className="navbar-user-section">
            {cotizacionDolar > 0 && (
              <span className="dollar-badge d-none d-lg-inline-flex">
                <i className="bi bi-currency-dollar"></i>
                {Number(cotizacionDolar).toLocaleString('es-AR')}
              </span>
            )}

            {alertasCount > 0 && (
              <Link to="/alertas" className="navbar-alerts-btn position-relative">
                <i className="bi bi-bell-fill"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {alertasCount}
                </span>
              </Link>
            )}

            <div className="navbar-divider d-none d-lg-block"></div>

            <span className="navbar-user-name d-none d-lg-flex">
              <i className="bi bi-person-circle"></i>
              {user.nombre || user.username}
            </span>

            <button className="glass-btn btn btn-sm navbar-logout-btn" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="d-none d-xl-inline">Salir</span>
            </button>

            {/* Mobile-only user info */}
            <div className="d-lg-none w-100 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="d-flex flex-wrap align-items-center gap-2">
                {cotizacionDolar > 0 && (
                  <span className="dollar-badge">
                    <i className="bi bi-currency-dollar"></i>
                    {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
                  </span>
                )}
                {alertasCount > 0 && (
                  <Link to="/alertas" className="navbar-alerts-btn">
                    <i className="bi bi-bell-fill me-1"></i>Alertas
                    <span className="badge bg-danger ms-1">{alertasCount}</span>
                  </Link>
                )}
                <span className="navbar-user-name">
                  <i className="bi bi-person-circle"></i>
                  {user.nombre || user.username}
                </span>
              </div>
              <button className="glass-btn btn btn-sm w-100 mt-2" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1"></i>Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
