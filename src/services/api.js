import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Instancia de axios configurada con baseURL, timeout e interceptors
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

/**
 * Interceptor de requests: adjunta el token JWT al header x-auth-token
 */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Error en request:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de responses: reintenta una vez en errores de conexión
 * y redirige a /login si recibe 401
 */
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    const isConnectionError = 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ERR_NETWORK' ||
      error.message.includes('Network Error') ||
      error.message.includes('Connection refused');
    
    if (isConnectionError && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log(`[API] Error de conexión. Reintentando en 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      
      try {
        const response = await axios(originalRequest);
        return response;
      } catch {
        console.error('[API] Reintento fallido');
      }
    }
    
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Respuesta con token y datos del usuario
   */
  login: (username, password) => api.post('/auth/login', { username, password }),

  /**
   * Registra un nuevo usuario
   * @param {Object} data - Datos del usuario a registrar
   * @returns {Promise<Object>} Respuesta con el usuario creado
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * Valida el token de autenticación actual
   * @returns {Promise<Object>} Respuesta con datos del usuario si el token es válido
   */
  validate: () => api.post('/auth/validate')
};

/**
 * Servicio de gestión de productos
 */
export const productoService = {
  /**
   * Obtiene todos los productos
   * @param {Object} [params] - Parámetros de filtro opcionales
   * @returns {Promise<Object>} Lista de productos
   */
  getAll: (params) => api.get('/productos', { params }),

  /**
   * Obtiene un producto por su ID
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Datos del producto
   */
  getById: (id) => api.get(`/productos/${id}`),

  /**
   * Crea un nuevo producto
   * @param {Object} data - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  create: (data) => api.post('/productos', data),

  /**
   * Actualiza un producto existente
   * @param {string} id - ID del producto
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Producto actualizado
   */
  update: (id, data) => api.put(`/productos/${id}`, data),

  /**
   * Elimina un producto
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/productos/${id}`),

  /**
   * Verifica si un SKU ya existe
   * @param {string} sku - Código SKU a verificar
   * @returns {Promise<Object>} { exists: boolean }
   */
  checkSku: (sku) => api.get(`/productos/check-sku/${sku}`)
};

/**
 * Servicio de gestión de movimientos de stock
 */
export const movimientoService = {
  /**
   * Obtiene todos los movimientos con filtros opcionales
   * @param {Object} [params] - Filtros (fechaInicio, fechaFin, tipo, producto)
   * @returns {Promise<Object>} Lista de movimientos
   */
  getAll: (params) => api.get('/movimientos', { params }),

  /**
   * Obtiene movimientos de un producto específico
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Movimientos del producto
   */
  getByProducto: (id) => api.get(`/movimientos/producto/${id}`),

  /**
   * Crea un nuevo movimiento
   * @param {Object} data - Datos del movimiento
   * @returns {Promise<Object>} Movimiento creado
   */
  create: (data) => api.post('/movimientos', data),

  /**
   * Actualiza un movimiento existente
   * @param {string} id - ID del movimiento
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Movimiento actualizado
   */
  update: (id, data) => api.put(`/movimientos/${id}`, data),

  /**
   * Elimina un movimiento (revertirá el stock)
   * @param {string} id - ID del movimiento
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/movimientos/${id}`),

  /**
   * Obtiene alertas de stock bajo generadas por movimientos
   * @returns {Promise<Object>} Lista de alertas
   */
  getAlertas: () => api.get('/movimientos/alertas')
};

/**
 * Servicio de gestión de proveedores
 */
export const proveedorService = {
  /**
   * Obtiene todos los proveedores
   * @param {Object} [params] - Parámetros de filtro opcionales
   * @returns {Promise<Object>} Lista de proveedores
   */
  getAll: (params) => api.get('/proveedores', { params }),

  /**
   * Crea un nuevo proveedor
   * @param {Object} data - Datos del proveedor
   * @returns {Promise<Object>} Proveedor creado
   */
  create: (data) => api.post('/proveedores', data),

  /**
   * Actualiza un proveedor existente
   * @param {string} id - ID del proveedor
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Proveedor actualizado
   */
  update: (id, data) => api.put(`/proveedores/${id}`, data),

  /**
   * Elimina un proveedor
   * @param {string} id - ID del proveedor
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/proveedores/${id}`)
};

/**
 * Servicio de gestión de clientes
 */
export const clienteService = {
  /**
   * Obtiene todos los clientes
   * @param {Object} [params] - Parámetros de filtro opcionales
   * @returns {Promise<Object>} Lista de clientes
   */
  getAll: (params) => api.get('/clientes', { params }),

  /**
   * Crea un nuevo cliente
   * @param {Object} data - Datos del cliente
   * @returns {Promise<Object>} Cliente creado
   */
  create: (data) => api.post('/clientes', data),

  /**
   * Actualiza un cliente existente
   * @param {string} id - ID del cliente
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Cliente actualizado
   */
  update: (id, data) => api.put(`/clientes/${id}`, data),

  /**
   * Elimina un cliente
   * @param {string} id - ID del cliente
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/clientes/${id}`)
};

/**
 * Servicio de gestión de usuarios del sistema
 */
export const usuarioService = {
  /**
   * Obtiene todos los usuarios
   * @returns {Promise<Object>} Lista de usuarios
   */
  getAll: () => api.get('/usuarios'),

  /**
   * Crea un nuevo usuario
   * @param {Object} data - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  create: (data) => api.post('/usuarios', data),

  /**
   * Actualiza un usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Usuario actualizado
   */
  update: (id, data) => api.put(`/usuarios/${id}`, data),

  /**
   * Elimina un usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/usuarios/${id}`)
};

/**
 * Servicio de configuración general del sistema
 */
export const configService = {
  /**
   * Obtiene la configuración actual
   * @returns {Promise<Object>} Datos de configuración
   */
  get: () => api.get('/config'),

  /**
   * Actualiza la configuración del sistema
   * @param {Object} data - Nueva configuración
   * @returns {Promise<Object>} Configuración actualizada
   */
  update: (data) => api.put('/config', data)
};

/**
 * Servicio de gestión de caja y cotización del dólar
 */
export const cajaService = {
  /**
   * Obtiene todos los movimientos de caja
   * @param {Object} [params] - Filtros opcionales
   * @returns {Promise<Object>} Lista de movimientos de caja
   */
  getAll: (params) => api.get('/caja', { params }),

  /**
   * Obtiene los saldos actuales de caja
   * @returns {Promise<Object>} Saldos por método de pago y moneda
   */
  getSaldos: () => api.get('/caja/saldos'),

  /**
   * Obtiene la cotización actual del dólar
   * @returns {Promise<Object>} Cotización del dólar
   */
  getCotizacion: () => api.get('/caja/cotizacion'),

  /**
   * Crea un nuevo movimiento de caja
   * @param {Object} data - Datos del movimiento
   * @returns {Promise<Object>} Movimiento de caja creado
   */
  create: (data) => api.post('/caja', data),

  /**
   * Actualiza la cotización del dólar
   * @param {number} cotizacion - Nuevo valor de cotización
   * @returns {Promise<Object>} Cotización actualizada
   */
  updateCotizacion: (cotizacion) => api.post('/caja/cotizacion', { cotizacion }),

  /**
   * Elimina un movimiento de caja
   * @param {string} id - ID del movimiento
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/caja/${id}`)
};

/**
 * Servicio de configuración de valores para equipos recibidos en parte de pago
 */
export const ppConfigService = {
  /**
   * Obtiene todas las configuraciones PP
   * @returns {Promise<Object>} Lista de configuraciones PP
   */
  getAll: () => api.get('/ppconfig'),

  /**
   * Busca configuraciones PP con filtros
   * @param {Object} [params] - Filtros de búsqueda
   * @returns {Promise<Object>} Configuraciones que coinciden
   */
  buscar: (params) => api.get('/ppconfig/buscar', { params }),

  /**
   * Crea una nueva configuración PP
   * @param {Object} data - Datos de la configuración
   * @returns {Promise<Object>} Configuración creada
   */
  create: (data) => api.post('/ppconfig', data),

  /**
   * Actualiza una configuración PP existente
   * @param {string} id - ID de la configuración
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Configuración actualizada
   */
  update: (id, data) => api.put(`/ppconfig/${id}`, data),

  /**
   * Elimina una configuración PP
   * @param {string} id - ID de la configuración
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/ppconfig/${id}`)
};

/**
 * Servicio de gestión de alertas de stock
 */
export const alertaService = {
  /**
   * Obtiene alertas de stock activas
   * @returns {Promise<Object>} Lista de alertas activas
   */
  getActivas: () => api.get('/alertas/activas'),

  /**
   * Obtiene alertas descartadas
   * @returns {Promise<Object>} Lista de alertas descartadas
   */
  getDescartadas: () => api.get('/alertas/descartadas'),

  /**
   * Obtiene todas las alertas con filtro opcional
   * @param {string} [estado] - Estado de las alertas ('activa', 'descartada')
   * @returns {Promise<Object>} Lista de alertas
   */
  getAll: (estado) => api.get('/alertas', { params: estado ? { estado } : {} }),

  /**
   * Obtiene estadísticas de alertas
   * @returns {Promise<Object>} Estadísticas de alertas
   */
  getEstadisticas: () => api.get('/alertas/estadisticas'),

  /**
   * Descarta una alerta de stock
   * @param {string} id - ID de la alerta
   * @returns {Promise<Object>} Alerta descartada
   */
  descartar: (id) => api.patch(`/alertas/${id}/descartar`),

  /**
   * Reincorpora una alerta descartada
   * @param {string} id - ID de la alerta
   * @returns {Promise<Object>} Alerta reincorporada
   */
  reincorporar: (id) => api.patch(`/alertas/${id}/reincorporar`),

  /**
   * Regenera todas las alertas de stock
   * @returns {Promise<Object>} Respuesta de generación
   */
  generarTodas: () => api.post('/alertas/generar')
};

/**
 * Servicio de gestión de ventas
 */
export const ventaService = {
  /**
   * Crea una nueva venta
   * @param {Object} data - Datos de la venta (cliente, items, metodoPago, etc.)
   * @returns {Promise<Object>} Venta creada con datos del ticket
   */
  crear: (data) => api.post('/ventas', data),

  /**
   * Confirma una reserva pendiente
   * @param {string} id - ID de la venta/reserva
   * @returns {Promise<Object>} Reserva confirmada
   */
  confirmarReserva: (id) => api.post(`/ventas/${id}/confirmar`),

  /**
   * Cancela una reserva pendiente
   * @param {string} id - ID de la venta/reserva
   * @returns {Promise<Object>} Reserva cancelada
   */
  cancelarReserva: (id) => api.post(`/ventas/${id}/cancelar`),

  /**
   * Obtiene una venta por su ID
   * @param {string} id - ID de la venta
   * @returns {Promise<Object>} Datos de la venta
   */
  getById: (id) => api.get(`/ventas/${id}`),

  /**
   * Obtiene todas las ventas con filtros opcionales
   * @param {Object} [params] - Filtros opcionales
   * @returns {Promise<Object>} Lista de ventas
   */
  getAll: (params) => api.get('/ventas', { params }),

  /**
   * Busca clientes por texto (nombre, apellido, instagram)
   * @param {string} texto - Texto de búsqueda
   * @returns {Promise<Object>} Clientes que coinciden
   */
  buscarCliente: (texto) => api.get('/ventas/buscar-cliente', { params: { q: texto } })
};

export default api;
