import { useState, useEffect, useRef, useCallback } from 'react';
import { productoService, clienteService, ventaService, configService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import { guardarTicket } from '../utils/ticketPDF';

const NuevaVenta = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', documento: '', telefono: '' });

  const productoRef = useRef(null);
  const clienteRef = useRef(null);

  useEffect(() => {
    fetchProductos();
    fetchConfig();
  }, []);

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data.filter(p => p.activo));
    } catch { toast.error('Error al cargar productos'); }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await configService.get();
      setConfig(data);
    } catch {}
  };

  const buscarProductos = (texto) => {
    if (!texto) {
      setSugerenciasProductos([]);
      return;
    }
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      p.sku?.toLowerCase().includes(texto.toLowerCase())
    ).slice(0, 8);
    setSugerenciasProductos(filtrados);
    setMostrarSugerencias(true);
  };

  const buscarClientes = async (texto) => {
    if (!texto || texto.length < 2) {
      setSugerenciasClientes([]);
      return;
    }
    try {
      const { data } = await ventaService.buscarCliente(texto);
      setSugerenciasClientes(data);
      setMostrarSugerenciasCliente(true);
    } catch {}
  };

  const agregarProducto = (producto) => {
    const existente = carrito.find(c => c.productoId === producto._id && 
      c.variante?.color === null && c.variante?.capacidad === null);
    
    let stockTotal = 0;
    if (producto.variantes?.length > 0) {
      stockTotal = producto.variantes.reduce((s, v) => s + (v.stock || 0), 0);
    }

    if (existente) {
      if (existente.cantidad < stockTotal) {
        setCarrito(carrito.map(c => 
          c.productoId === producto._id 
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        ));
      } else {
        toast.warning('Stock insuficiente');
        return;
      }
    } else {
      setCarrito([...carrito, {
        productoId: producto._id,
        nombre: producto.nombre,
        precioUnitario: producto.precioVenta,
        cantidad: 1,
        sku: producto.sku,
        garantiaMeses: producto.garantiaMeses || producto.garantia?.meses || 12,
        variante: null
      }]);
    }
    setBusquedaProducto('');
    setSugerenciasProductos([]);
  };

  const quitarProducto = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCarrito(carrito.map((c, i) => 
      i === index ? { ...c, cantidad: nuevaCantidad } : c
    ));
  };

  const seleccionarCliente = (c) => {
    setCliente(c);
    setBusquedaCliente(c.nombre);
    setSugerenciasClientes([]);
    setMostrarSugerenciasCliente(false);
    setMostrarNuevoCliente(false);
  };

  const crearNuevoCliente = () => {
    if (!nuevoCliente.nombre) {
      toast.warning('Ingresa nombre del cliente');
      return;
    }
    setCliente({ ...nuevoCliente, _id: 'nuevo', crear: true });
    setBusquedaCliente(nuevoCliente.nombre);
    setMostrarNuevoCliente(false);
  };

  const calcularTotal = () => {
    const subtotal = carrito.reduce((s, c) => s + (c.precioUnitario * c.cantidad), 0);
    const iva = Math.round(subtotal * 0.21);
    return { subtotal, iva, total: subtotal + iva };
  };

  const confirmarVenta = async (esReserva = false) => {
    if (carrito.length === 0) {
      toast.warning('Agrega productos al carrito');
      return;
    }

    const confirmados = await confirm(
      esReserva 
        ? '¿Confirmar como RESERVA (10% seña)?' 
        : '¿Confirmar la VENTA?'
    );
    if (!confirmados) return;

    setLoading(true);
    try {
      const payload = {
        cliente: cliente || {},
        items: carrito.map(c => ({
          productoId: c.productoId,
          cantidad: c.cantidad,
          variante: c.variante,
          precioUnitario: c.precioUnitario,
          descripcion: c.nombre
        })),
        metodoPago: 'efectivo',
        formaPago: 'contado',
        generarReserva: esReserva,
        senia: esReserva ? Math.round(calcularTotal().total * 0.1) : 0
      };

      const { data } = await ventaService.crear(payload);
      
      toast.success(esReserva ? 'Reserva creada!' : 'Venta confirmada!');
      
      if (data.ticket) {
        try {
          guardarTicket(data.ticket, config, cliente);
        } catch { console.error('Error al generar PDF'); }
      }

      setCarrito([]);
      setCliente(null);
      setBusquedaCliente('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, iva, total } = calcularTotal();

  return (
    <div className="container-fluid py-3">
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="glass-card card">
            <div className="card-header">
              <h5 className="mb-0"><i className="bi bi-cart-plus me-2"></i>Buscar Productos</h5>
            </div>
            <div className="card-body">
              <div className="position-relative">
                <input
                  type="text"
                  className="glass-input form-control"
                  placeholder="Buscar por nombre o SKU..."
                  value={busquedaProducto}
                  onChange={e => { setBusquedaProducto(e.target.value); buscarProductos(e.target.value); }}
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                  ref={productoRef}
                />
                {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                  <div className="position-absolute w-100 glass-card" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                    {sugerenciasProductos.map(p => (
                      <div
                        key={p._id}
                        className="p-2 border-bottom cursor-pointer hover-bg"
                        onClick={() => agregarProducto(p)}
                      >
                        <div className="fw-bold">{p.nombre}</div>
                        <small className="text-muted">${p.precioVenta} | Stock: {p.variantes?.reduce((s, v) => s + v.stock, 0) || 0}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card card mt-3">
            <div className="card-header">
              <h5 className="mb-0"><i className="bi bi-cart-fill me-2"></i>Carrito ({carrito.length})</h5>
            </div>
            <div className="card-body">
              {carrito.length === 0 ? (
                <p className="text-center text-muted py-4">Carrito vacío</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cant</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={() => quitarProducto(i)}>
                              <i className="bi bi-x"></i>
                            </button>
                          </td>
                          <td>{item.nombre}</td>
                          <td>${item.precioUnitario.toLocaleString()}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '60px' }}
                              value={item.cantidad}
                              onChange={e => actualizarCantidad(i, parseInt(e.target.value) || 1)}
                              min={1}
                            />
                          </td>
                          <td>${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-card card">
            <div className="card-header">
              <h5 className="mb-0"><i className="bi bi-person-fill me-2"></i>Cliente</h5>
            </div>
            <div className="card-body">
              <div className="position-relative mb-2">
                <input
                  type="text"
                  className="glass-input form-control"
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onChange={e => { setBusquedaCliente(e.target.value); buscarClientes(e.target.value); }}
                  onBlur={() => setTimeout(() => setMostrarSugerenciasCliente(false), 200)}
                  ref={clienteRef}
                />
                {mostrarSugerenciasCliente && sugerenciasClientes.length > 0 && (
                  <div className="position-absolute w-100 glass-card" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {sugerenciasClientes.map(c => (
                      <div
                        key={c._id}
                        className="p-2 border-bottom cursor-pointer"
                        onClick={() => seleccionarCliente(c)}
                      >
                        <div className="fw-bold">{c.nombre}</div>
                        <small className="text-muted">{c.documento}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="btn btn-sm btn-outline-info w-100"
                onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)}
              >
                <i className="bi bi-plus-circle me-1"></i>Nuevo Cliente
              </button>
              {mostrarNuevoCliente && (
                <div className="mt-2 p-2 border rounded">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Nombre *"
                    value={nuevoCliente.nombre}
                    onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Documento"
                    value={nuevoCliente.documento}
                    onChange={e => setNuevoCliente({ ...nuevoCliente, documento: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Teléfono"
                    value={nuevoCliente.telefono}
                    onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  />
                  <button className="btn btn-sm btn-primary w-100" onClick={crearNuevoCliente}>
                    Agregar
                  </button>
                </div>
              )}
              {cliente && !mostrarNuevoCliente && (
                <div className="mt-2 p-2 border rounded bg-light">
                  <strong>{cliente.nombre}</strong>
                  {cliente.documento && <><br /><small>{cliente.documento}</small></>}
                  {cliente.telefono && <><br /><small>{cliente.telefono}</small></>}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Resumen</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>IVA (21%):</span>
                <span>${iva.toLocaleString()}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong className="fs-5">TOTAL:</strong>
                <strong className="fs-5 text-success">${total.toLocaleString()}</strong>
              </div>
              
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg"
                  onClick={() => confirmarVenta(false)}
                  disabled={loading || carrito.length === 0}
                >
                  <i className="bi bi-check-circle me-2"></i>CONFIRMAR VENTA
                </button>
                <button
                  className="btn btn-info btn-lg"
                  onClick={() => confirmarVenta(true)}
                  disabled={loading || carrito.length === 0}
                >
                  <i className="bi bi-calendar-check me-2"></i>RESERVA (10% seña)
                </button>
              </div>
              <small className="text-muted d-block text-center mt-2">
                La reserva dura 5 días
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaVenta;