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

/**
 * Servicio de gestión de terceros (clientes/proveedores unificados)
 */
export const terceroService = {
  /**
   * Obtiene todos los terceros
   * @param {Object} [params] - Filtros opcionales
   * @returns {Promise<Object>} Lista de terceros
   */
  getAll: (params) => api.get('/terceros', { params }),

  /**
   * Obtiene un tercero por su ID
   * @param {string} id - ID del tercero
   * @returns {Promise<Object>} Datos del tercero
   */
  getById: (id) => api.get(`/terceros/${id}`),

  /**
   * Crea un nuevo tercero
   * @param {Object} data - Datos del tercero
   * @returns {Promise<Object>} Tercero creado
   */
  create: (data) => api.post('/terceros', data),

  /**
   * Actualiza un tercero existente
   * @param {string} id - ID del tercero
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Tercero actualizado
   */
  update: (id, data) => api.put(`/terceros/${id}`, data),

  /**
   * Elimina un tercero
   * @param {string} id - ID del tercero
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  delete: (id) => api.delete(`/terceros/${id}`),

  /**
   * Busca terceros por texto
   * @param {string} q - Texto de búsqueda
   * @returns {Promise<Object>} Terceros que coinciden
   */
  buscar: (q) => api.get('/terceros/buscar', { params: { q } })
};

/**
 * Servicio de gestión de cuentas corrientes
 */
export const cuentaCorrienteService = {
  /**
   * Obtiene todas las cuentas corrientes
   * @param {Object} [params] - Filtros (id_tercero, tipo, moneda, activa)
   * @returns {Promise<Object>} Lista de cuentas corrientes
   */
  getAll: (params) => api.get('/cuentas-corrientes', { params }),

  /**
   * Obtiene una cuenta corriente por su ID
   * @param {string} id - ID de la cuenta
   * @returns {Promise<Object>} Datos de la cuenta con saldo calculado
   */
  getById: (id) => api.get(`/cuentas-corrientes/${id}`),

  /**
   * Crea una nueva cuenta corriente
   * @param {Object} data - Datos de la cuenta
   * @returns {Promise<Object>} Cuenta creada
   */
  create: (data) => api.post('/cuentas-corrientes', data),

  /**
   * Actualiza una cuenta corriente existente
   * @param {string} id - ID de la cuenta
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Cuenta actualizada
   */
  update: (id, data) => api.put(`/cuentas-corrientes/${id}`, data),

  /**
   * Cierra una cuenta corriente (solo si saldo es 0)
   * @param {string} id - ID de la cuenta
   * @returns {Promise<Object>} Respuesta de cierre
   */
  cerrar: (id) => api.delete(`/cuentas-corrientes/${id}`),

  /**
   * Obtiene cuentas corrientes de un tercero
   * @param {string} terceroId - ID del tercero
   * @returns {Promise<Object>} Cuentas del tercero
   */
  getByTercero: (terceroId) => api.get(`/cuentas-corrientes/tercero/${terceroId}`),

  /**
   * Busca cuentas por nombre de tercero
   * @param {string} q - Texto de búsqueda
   * @param {string} [tipo] - Filtrar por cliente/proveedor
   * @param {string} [moneda] - Filtrar por ARS/USD
   * @returns {Promise<Object>} Cuentas que coinciden
   */
  buscar: (q, tipo, moneda) => api.get('/cuentas-corrientes/buscar', { params: { q, tipo, moneda } }),

  /**
   * Obtiene cuentas corrientes vencidas (fuera de límite de crédito)
   * @param {Object} [params] - Filtros (tipo, moneda)
   * @returns {Promise<Object>} Cuentas vencidas
   */
  getVencidas: (params) => api.get('/cuentas-corrientes/vencidas', { params }),

  /**
   * Obtiene resumen de saldos agrupados por tipo y moneda
   * @param {Object} [params] - Filtros (id_tercero)
   * @returns {Promise<Object>} Resumen de saldos
   */
  getSaldos: (params) => api.get('/cuentas-corrientes/saldos', { params })
};

/**
 * Servicio de gestión de movimientos de cuenta corriente (libro diario)
 */
export const movimientoCtaService = {
  /**
   * Obtiene todos los movimientos
   * @param {Object} [params] - Filtros (id_cuenta, tipo, moneda, desde, hasta)
   * @returns {Promise<Object>} Lista de movimientos
   */
  getAll: (params) => api.get('/movimientos-cta', { params }),

  /**
   * Obtiene un movimiento por su ID
   * @param {string} id - ID del movimiento
   * @returns {Promise<Object>} Datos del movimiento
   */
  getById: (id) => api.get(`/movimientos-cta/${id}`),

  /**
   * Crea un nuevo movimiento
   * @param {Object} data - Datos del movimiento
   * @returns {Promise<Object>} Movimiento creado
   */
  create: (data) => api.post('/movimientos-cta', data),

  /**
   * Obtiene movimientos de una cuenta
   * @param {string} cuentaId - ID de la cuenta
   * @returns {Promise<Object>} Movimientos de la cuenta
   */
  getByCuenta: (cuentaId) => api.get(`/movimientos-cta/cuenta/${cuentaId}`),

  /**
   * Obtiene el saldo calculado de una cuenta (agregación)
   * @param {string} cuentaId - ID de la cuenta
   * @returns {Promise<Object>} { debe, haber, saldo } + por_moneda
   */
  getSaldo: (cuentaId) => api.get(`/movimientos-cta/cuenta/${cuentaId}/saldo`),

  /**
   * Obtiene el estado de cuenta con movimientos en período
   * @param {string} cuentaId - ID de la cuenta
   * @param {Object} [params] - Filtros (desde, hasta)
   * @returns {Promise<Object>} Estado de cuenta
   */
  getEstadoCuenta: (cuentaId, params) => api.get(`/movimientos-cta/cuenta/${cuentaId}/estado`, { params }),

  /**
   * Obtiene resumen de movimientos agrupados por moneda
   * @param {Object} [params] - Filtros (id_cuenta, desde, hasta)
   * @returns {Promise<Object>} Resumen por moneda
   */
  getResumen: (params) => api.get('/movimientos-cta/resumen', { params })
};

/**
 * Servicio de gestión de comprobantes financieros
 */
export const comprobanteService = {
  /**
   * Obtiene todos los comprobantes
   * @param {Object} [params] - Filtros (id_cuenta, tipo, estado, moneda, desde, hasta)
   * @returns {Promise<Object>} Lista de comprobantes
   */
  getAll: (params) => api.get('/comprobantes', { params }),

  /**
   * Obtiene un comprobante por su ID
   * @param {string} id - ID del comprobante
   * @returns {Promise<Object>} Datos del comprobante
   */
  getById: (id) => api.get(`/comprobantes/${id}`),

  /**
   * Crea un nuevo comprobante
   * @param {Object} data - Datos del comprobante
   * @returns {Promise<Object>} Comprobante creado con saldo actual
   */
  create: (data) => api.post('/comprobantes', data),

  /**
   * Aplica un pago parcial o total a un comprobante
   * @param {string} id - ID del comprobante
   * @param {number} monto - Monto del pago
   * @returns {Promise<Object>} Comprobante actualizado con saldo
   */
  pagar: (id, monto) => api.post(`/comprobantes/${id}/pago`, { monto }),

  /**
   * Aplica una seña a un comprobante
   * @param {string} id - ID del comprobante
   * @param {string} idSenia - ID del comprobante de seña
   * @returns {Promise<Object>} Comprobante actualizado
   */
  aplicarSenia: (id, idSenia) => api.post(`/comprobantes/${id}/senia`, { id_senia: idSenia }),

  /**
   * Anula un comprobante
   * @param {string} id - ID del comprobante
   * @param {string} [motivo] - Motivo de la anulación
   * @returns {Promise<Object>} Comprobante anulado
   */
  anular: (id, motivo) => api.post(`/comprobantes/${id}/anular`, { motivo }),

  /**
   * Obtiene comprobantes de una cuenta
   * @param {string} cuentaId - ID de la cuenta
   * @param {Object} [params] - Filtros (tipo, estado, desde, hasta)
   * @returns {Promise<Object>} Comprobantes de la cuenta
   */
  getByCuenta: (cuentaId, params) => api.get(`/comprobantes/cuenta/${cuentaId}`, { params }),

  /**
   * Obtiene comprobantes vencidos
   * @returns {Promise<Object>} Comprobantes vencidos
   */
  getVencidos: () => api.get('/comprobantes/vencidos'),

  /**
   * Obtiene el próximo número de comprobante
   * @param {Object} params - { tipo, moneda }
   * @returns {Promise<Object>} Próximo número
   */
  getProximo: (params) => api.get('/comprobantes/proximo', { params }),

  /**
   * Obtiene resumen de comprobantes por moneda
   * @param {Object} [params] - Filtros (id_cuenta, desde, hasta)
   * @returns {Promise<Object>} Resumen
   */
  getResumen: (params) => api.get('/comprobantes/resumen', { params })
};

/**
 * Servicio de gestión de préstamos
 */
export const prestamoService = {
  /**
   * Obtiene todos los préstamos
   * @param {Object} [params] - Filtros (estado, moneda, acreedor)
   * @returns {Promise<Object>} Lista de préstamos
   */
  getAll: (params) => api.get('/prestamos', { params }),

  /**
   * Obtiene un préstamo por su ID (incluye cuotas)
   * @param {string} id - ID del préstamo
   * @returns {Promise<Object>} Préstamo con cuotas
   */
  getById: (id) => api.get(`/prestamos/${id}`),

  /**
   * Crea un nuevo préstamo con plan de amortización
   * @param {Object} data - Datos del préstamo
   * @returns {Promise<Object>} Préstamo creado
   */
  create: (data) => api.post('/prestamos', data),

  /**
   * Cancela un préstamo (anula cuotas pendientes)
   * @param {string} id - ID del préstamo
   * @returns {Promise<Object>} Préstamo cancelado
   */
  cancelar: (id) => api.post(`/prestamos/${id}/cancelar`),

  /**
   * Paga una cuota de un préstamo
   * @param {string} prestamoId - ID del préstamo
   * @param {number} nro - Número de cuota
   * @param {string} [metodoPago] - Método de pago
   * @returns {Promise<Object>} Préstamo y cuota actualizados
   */
  pagarCuota: (prestamoId, nro, metodoPago) => api.post(`/prestamos/${prestamoId}/cuota/${nro}/pagar`, { metodoPago }),

  /**
   * Anula una cuota pagada
   * @param {string} cuotaId - ID de la cuota
   * @returns {Promise<Object>} Cuota anulada
   */
  anularCuota: (cuotaId) => api.post(`/prestamos/cuota/${cuotaId}/anular`),

  /**
   * Obtiene las cuotas de un préstamo
   * @param {string} prestamoId - ID del préstamo
   * @returns {Promise<Object>} Lista de cuotas
   */
  getCuotas: (prestamoId) => api.get(`/prestamos/${prestamoId}/cuotas`),

  /**
   * Obtiene cuotas vencidas de todos los préstamos
   * @returns {Promise<Object>} Cuotas vencidas
   */
  getCuotasVencidas: () => api.get('/prestamos/cuotas-vencidas'),

  /**
   * Obtiene cuotas con vencimiento próximo
   * @param {Object} [params] - { dias } (default: 30)
   * @returns {Promise<Object>} Cuotas próximas
   */
  getProximas: (params) => api.get('/prestamos/proximas', { params }),

  /**
   * Obtiene resumen de préstamos activos
   * @returns {Promise<Object>} Resumen por moneda
   */
  getResumen: () => api.get('/prestamos/resumen')
};

/**
 * Servicio de gestión de categorías de productos
 */
export const categoriaService = {
  /**
   * Obtiene todas las categorías
   * @param {Object} [params] - Filtros (activa)
   * @returns {Promise<Object>} Lista de categorías
   */
  getAll: (params) => api.get('/categorias', { params }),

  /**
   * Obtiene una categoría por ID
   * @param {string} id - ID de la categoría
   * @returns {Promise<Object>} Categoría con breadcrumb
   */
  getById: (id) => api.get(`/categorias/${id}`),

  /**
   * Crea una nueva categoría
   * @param {Object} data - Datos (nombre, id_padre?, descripcion?)
   * @returns {Promise<Object>} Categoría creada
   */
  create: (data) => api.post('/categorias', data),

  /**
   * Actualiza una categoría
   * @param {string} id - ID
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Categoría actualizada
   */
  update: (id, data) => api.put(`/categorias/${id}`, data),

  /**
   * Elimina (desactiva) una categoría
   * @param {string} id - ID
   * @returns {Promise<Object>} Respuesta
   */
  delete: (id) => api.delete(`/categorias/${id}`),

  /**
   * Obtiene el árbol completo de categorías
   * @returns {Promise<Object>} Árbol jerárquico
   */
  getArbol: () => api.get('/categorias/arbol'),

  /**
   * Obtiene el breadcrumb (path) de una categoría
   * @param {string} id - ID
   * @returns {Promise<Object>} { id, path: "Granos > Cereales > Trigo" }
   */
  getPath: (id) => api.get(`/categorias/path/${id}`)
};

/**
 * Servicio de gestión de listas de precios
 */
export const listaPrecioService = {
  /**
   * Obtiene todas las listas de precios
   * @param {Object} [params] - Filtros (activa, moneda)
   * @returns {Promise<Object>} Lista de precios
   */
  getAll: (params) => api.get('/listas-precio', { params }),

  /**
   * Obtiene una lista por ID
   * @param {string} id - ID
   * @returns {Promise<Object>} Lista de precios
   */
  getById: (id) => api.get(`/listas-precio/${id}`),

  /**
   * Crea una nueva lista de precios
   * @param {Object} data - { nombre, moneda, descripcion? }
   * @returns {Promise<Object>} Lista creada
   */
  create: (data) => api.post('/listas-precio', data),

  /**
   * Actualiza una lista
   * @param {string} id - ID
   * @param {Object} data - Datos
   * @returns {Promise<Object>} Lista actualizada
   */
  update: (id, data) => api.put(`/listas-precio/${id}`, data),

  /**
   * Elimina (desactiva) una lista
   * @param {string} id - ID
   * @returns {Promise<Object>} Respuesta
   */
  delete: (id) => api.delete(`/listas-precio/${id}`),

  /**
   * Obtiene listas activas
   * @returns {Promise<Object>} Listas activas
   */
  getActivas: () => api.get('/listas-precio/activas')
};

/**
 * Servicio de gestión de precios por producto
 */
export const precioProductoService = {
  /**
   * Obtiene todos los precios
   * @param {Object} [params] - Filtros (id_producto, id_lista, moneda, activo)
   * @returns {Promise<Object>} Lista de precios
   */
  getAll: (params) => api.get('/precios-producto', { params }),

  /**
   * Obtiene un precio por ID
   * @param {string} id - ID
   * @returns {Promise<Object>} Precio
   */
  getById: (id) => api.get(`/precios-producto/${id}`),

  /**
   * Crea un nuevo precio
   * @param {Object} data - { id_producto, id_lista, precio, moneda, vigencia_desde, vigencia_hasta? }
   * @returns {Promise<Object>} Precio creado
   */
  create: (data) => api.post('/precios-producto', data),

  /**
   * Actualiza un precio
   * @param {string} id - ID
   * @param {Object} data - Datos
   * @returns {Promise<Object>} Precio actualizado
   */
  update: (id, data) => api.put(`/precios-producto/${id}`, data),

  /**
   * Elimina (desactiva) un precio
   * @param {string} id - ID
   * @returns {Promise<Object>} Respuesta
   */
  delete: (id) => api.delete(`/precios-producto/${id}`),

  /**
   * Obtiene el precio vigente de un producto en una lista
   * @param {string} productoId - ID del producto
   * @param {string} listaId - ID de la lista
   * @param {Object} [params] - { fecha }
   * @returns {Promise<Object>} Precio vigente
   */
  getVigente: (productoId, listaId, params) => api.get(`/precios-producto/vigente/${productoId}/${listaId}`, { params }),

  /**
   * Obtiene precios de un producto
   * @param {string} productoId - ID del producto
   * @param {Object} [params] - { fecha }
   * @returns {Promise<Object>} Precios del producto
   */
  getByProducto: (productoId, params) => api.get(`/precios-producto/producto/${productoId}`, { params }),

  /**
   * Obtiene precios de una lista
   * @param {string} listaId - ID de la lista
   * @param {Object} [params] - { fecha }
   * @returns {Promise<Object>} Precios de la lista
   */
  getByLista: (listaId, params) => api.get(`/precios-producto/lista/${listaId}`, { params })
};

/**
 * Servicio de gestión de movimientos de stock (inventario)
 */
export const movimientoStockService = {
  /**
   * Obtiene todos los movimientos de stock
   * @param {Object} [params] - Filtros (id_producto, tipo, deposito, desde, hasta)
   * @returns {Promise<Object>} Lista de movimientos
   */
  getAll: (params) => api.get('/movimientos-stock', { params }),

  /**
   * Obtiene movimientos de un producto
   * @param {string} productoId - ID del producto
   * @param {Object} [params] - Filtros (tipo, desde, hasta)
   * @returns {Promise<Object>} Movimientos del producto
   */
  getByProducto: (productoId, params) => api.get(`/movimientos-stock/producto/${productoId}`, { params }),

  /**
   * Obtiene movimientos de un comprobante
   * @param {string} comprobanteId - ID del comprobante
   * @returns {Promise<Object>} Movimientos del comprobante
   */
  getByComprobante: (comprobanteId) => api.get(`/movimientos-stock/comprobante/${comprobanteId}`),

  /**
   * Obtiene stock actual de un producto en un depósito
   * @param {string} productoId - ID del producto
   * @param {string} [deposito] - Nombre del depósito (default: Central)
   * @returns {Promise<Object>} { entradas, salidas, stock }
   */
  getStockActual: (productoId, deposito) => api.get(`/movimientos-stock/stock/${productoId}`, { params: deposito ? { deposito } : {} }),

  /**
   * Obtiene stock por depósito
   * @returns {Promise<Object>} Stock agrupado por depósito y producto
   */
  getStockPorDeposito: () => api.get('/movimientos-stock/por-deposito')
};

export default api;
