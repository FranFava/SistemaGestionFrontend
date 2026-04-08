/**
 * ============================================
 * Página de Login
 * Formulario de autenticación de usuarios
 * ============================================
 */

// React - Hooks
import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';

/**
 * Página de Login
 * @description Formulario para autenticar usuarios en el sistema
 * @returns {JSX.Element} Formulario de inicio de sesión
 */
const Login = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de la UI
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Context y navegación
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // Handlers - Funciones manejadoras
  // ============================================

  /**
   * Manejador del envío del formulario
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 p-3">
      {/* Card de login con efecto glass */}
      <div className="glass-card p-4 p-md-5" style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Header con logo y título */}
        <div className="text-center mb-4">
          <i className="bi bi-box-seam" style={{ fontSize: '3rem' }}></i>
          <h2 className="mt-2">Sistema de Stock</h2>
          <p className="text-glass-muted">Ingrese sus credenciales</p>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="glass-alert alert-danger alert">
            {error}
          </div>
        )}
        
        {/* Formulario de login */}
        <form onSubmit={handleSubmit}>
          {/* Campo usuario */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-person me-1"></i>
              Usuario
            </label>
            <input
              type="text"
              className="glass-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          {/* Campo contraseña */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-key me-1"></i>
              Contraseña
            </label>
            <input
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Botón de envío */}
          <button 
            type="submit" 
            className="glass-btn glass-btn-primary w-100" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Ingresando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
