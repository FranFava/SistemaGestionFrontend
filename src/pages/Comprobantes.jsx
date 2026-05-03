import { useState, useEffect, useCallback } from 'react';
import { comprobanteService, cuentaCorrienteService, terceroService, productoService } from '../services/api';
import { toast, confirm } from '../components/Swal';

const Comprobantes = () => {
  const [comprobantes, setComprobantes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [terceros, setTerceros] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ origen: 'compra', tipo: '', estado: '', moneda: '' });
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pagoId, setPagoId] = useState(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [form, setForm] = useState({
    id_cuenta: '', tipo: 'FACT', origen: 'compra', moneda: 'ARS',
    nro_comprobante: '', fecha_vencimiento: '', cotizacion_usado: '',
    observaciones: '', items: [], id_remito_origen: ''
  });
  const [itemForm, setItemForm] = useState({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchComprobantes();
    fetchCuentas();
    fetchTerceros();
    fetchProductos();
  }, [filters]);

  const fetchComprobantes = async () => {
    try {
      const params = {};
      if (filters.origen) params.origen = filters.origen;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.estado) params.estado = filters.estado;
      if (filters.moneda) params.moneda = filters.moneda;
      const res = await comprobanteService.getAll(params);
      const arr = res.data?.data || res.data || [];
      setComprobantes(arr);
    } catch {
      toast.error('Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentas = async () => {
    try {
      const res = await cuentaCorrienteService.getAll();
      const arr = res.data?.data || res.data || [];
      setCuentas(arr);
    } catch { toast.error('Error al cargar cuentas'); }
  };

  const fetchTerceros = async () => {
    try {
      const res = await terceroService.getAll();
      const arr = res.data?.data || res.data || [];
      setTerceros(arr);
    } catch { toast.error('Error al cargar terceros'); }
  };

  const fetchProductos = async () => {
    try {
      const res = await productoService.getAll();
      const arr = res.data?.data || res.data || [];
      setProductos(arr.filter(p => p.activo));
    } catch { toast.error('Error al cargar productos'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items.length) {
      toast.error('Agrega al menos un item al comprobante');
      return;
    }
    try {
      const payload = { ...form, items: form.items.map(i => ({ ...i, descuento_pct: i.descuento_pct || 0 })) };
      if (editingId) {
        toast.info('Edicion no soportada para comprobantes con items');
      } else {
        const res = await comprobanteService.create(payload);
        const created = res.data?.data || res.data;
        toast.success(`Comprobante ${created.nro_comprobante} creado`);
      }
      setShowModal(false);
      resetForm();
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear');
    }
  };

  const handlePago = async () => {
    try {
      await comprobanteService.pagar(pagoId, Number(pagoMonto));
      toast.success('Pago registrado');
      setShowPagoModal(false);
      setPagoId(null);
      setPagoMonto('');
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al pagar');
    }
  };

  const handleAnular = async (id) => {
    const result = await confirm('Anular comprobante', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await comprobanteService.anular(id, 'Anulado por usuario');
        toast.success('Comprobante anulado');
        fetchComprobantes();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error');
      }
    }
  };

  const addItem = () => {
    if (!itemForm.id_producto || !itemForm.cantidad || !itemForm.precio_unitario) {
      toast.error('Completa todos los campos del item');
      return;
    }
    const prod = productos.find(p => p._id === itemForm.id_producto);
    setForm({
      ...form,
      items: [...form.items, {
        id_producto: itemForm.id_producto,
        cantidad: Number(itemForm.cantidad),
        precio_unitario: Number(itemForm.precio_unitario),
        descuento_pct: Number(itemForm.descuento_pct) || 0,
        moneda: form.moneda
      }]
    });
    setItemForm({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const calcTotal = () => {
    return form.items.reduce((sum, item) => {
      const bruto = item.cantidad * item.precio_unitario;
      const desc = bruto * (item.descuento_pct / 100);
      return sum + (bruto - desc);
    }, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  };

  const resetForm = () => {
    setForm({
      id_cuenta: '', tipo: 'FACT', origen: 'compra', moneda: 'ARS',
      nro_comprobante: '', fecha_vencimiento: '', cotizacion_usado: '',
      observaciones: '', items: [], id_remito_origen: ''
    });
    setItemForm({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
    setEditingId(null);
  };

  const getTerceroName = (cuenta) => {
    const t = cuenta?.id_tercero;
    return t?.razon_social || t?.nombre || '—';
  };

  const tipoBadge = (tipo) => {
    const colors = { FACT: 'primary', REC: 'success', NC: 'danger', ND: 'warning', SENIA: 'info', REM: 'secondary' };
    return <span className={`badge bg-${colors[tipo] || 'secondary'}`}>{tipo}</span>;
  };

  const estadoBadge = (estado) => {
    const colors = { pendiente: 'warning', parcial: 'info', cancelado: 'success' };
    return <span className={`badge bg-${colors[estado] || 'secondary'}`}>{estado}</span>;
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-receipt me-2"></i>Comprobantes</h4>
          <p className="text-muted mb-0">Facturas, remitos, notas de credito y mas</p>
        </div>
        <button className="glass-btn glass-btn-primary btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i>Nuevo Comprobante
        </button>
      </div>

      {/* Filtros */}
      <div className="glass-card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-2">
            <label className="form-label small text-muted">Origen</label>
            <select className="form-select form-select-sm glass-input" value={filters.origen}
              onChange={e => setFilters({ ...filters, origen: e.target.value })}>
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small text-muted">Tipo</label>
            <select className="form-select form-select-sm glass-input" value={filters.tipo}
              onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
              <option value="">Todos</option>
              <option value="FACT">FACT</option>
              <option value="REM">REM</option>
              <option value="NC">NC</option>
              <option value="ND">ND</option>
              <option value="REC">REC</option>
              <option value="SENIA">SENIA</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small text-muted">Estado</label>
            <select className="form-select form-select-sm glass-input" value={filters.estado}
              onChange={e => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small text-muted">Moneda</label>
            <select className="form-select form-select-sm glass-input" value={filters.moneda}
              onChange={e => setFilters({ ...filters, moneda: e.target.value })}>
              <option value="">Todas</option>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-table">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead>
              <tr>
                <th></th>
                <th>Tipo</th>
                <th>Nro</th>
                <th>Tercero</th>
                <th>Fecha</th>
                <th>Vencimiento</th>
                <th>Moneda</th>
                <th>Total</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.map(c => (
                <>
                  <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}>
                    <td><i className={`bi bi-chevron-${expandedId === c._id ? 'down' : 'right'}`}></i></td>
                    <td>{tipoBadge(c.tipo)}</td>
                    <td><code>{c.nro_comprobante}</code></td>
                    <td>{getTerceroName(c.id_cuenta)}</td>
                    <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                    <td>{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-AR') : '—'}</td>
                    <td><span className={`badge bg-${c.moneda === 'USD' ? 'warning' : 'info'}`}>{c.moneda}</span></td>
                    <td><strong>${Number(c.monto_original?.$numberDecimal || c.monto_original || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
                    <td>${Number(c.saldo_pendiente?.$numberDecimal || c.saldo_pendiente || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td>{estadoBadge(c.estado)}</td>
                    <td className="text-end" onClick={e => e.stopPropagation()}>
                      {c.estado !== 'cancelado' && c.tipo === 'FACT' && (
                        <button className="btn btn-sm btn-outline-success me-1" title="Pagar"
                          onClick={() => { setPagoId(c._id); setPagoMonto(c.saldo_pendiente?.$numberDecimal || c.saldo_pendiente || ''); setShowPagoModal(true); }}>
                          <i className="bi bi-cash"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger" title="Anular"
                        onClick={() => handleAnular(c._id)}>
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </td>
                  </tr>
                  {expandedId === c._id && c.items?.length > 0 && (
                    <tr key={`${c._id}-items`}>
                      <td colSpan="11" className="bg-dark bg-opacity-25">
                        <table className="table table-sm mb-0">
                          <thead><tr><th>Producto</th><th>Cantidad</th><th>P. Unitario</th><th>Desc%</th><th>Subtotal</th></tr></thead>
                          <tbody>
                            {c.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.id_producto?.nombre || '—'}</td>
                                <td>{item.cantidad?.$numberDecimal || item.cantidad}</td>
                                <td>${Number(item.precio_unitario?.$numberDecimal || item.precio_unitario).toLocaleString('es-AR')}</td>
                                <td>{item.descuento_pct?.$numberDecimal || item.descuento_pct || 0}%</td>
                                <td>${Number(item.subtotal?.$numberDecimal || item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {comprobantes.length === 0 && (
                <tr><td colSpan="11" className="text-center text-muted py-4">No hay comprobantes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Comprobante */}
      {showModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-receipt me-2"></i>Nuevo Comprobante</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Cuenta Corriente <span className="text-danger">*</span></label>
                      <select className="form-select glass-input" value={form.id_cuenta}
                        onChange={e => setForm({ ...form, id_cuenta: e.target.value })} required>
                        <option value="">Seleccionar cuenta</option>
                        {cuentas.filter(c => c.activa).map(c => (
                          <option key={c._id} value={c._id}>
                            {getTerceroName(c)} — {c.tipo} {c.moneda}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Tipo</label>
                      <select className="form-select glass-input" value={form.tipo}
                        onChange={e => setForm({ ...form, tipo: e.target.value })}>
                        <option value="FACT">FACT</option>
                        <option value="REM">REM</option>
                        <option value="NC">NC</option>
                        <option value="ND">ND</option>
                        <option value="REC">REC</option>
                        <option value="SENIA">SENIA</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Moneda</label>
                      <select className="form-select glass-input" value={form.moneda}
                        onChange={e => setForm({ ...form, moneda: e.target.value })}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Nro Comprobante</label>
                      <input type="text" className="form-control glass-input" value={form.nro_comprobante}
                        onChange={e => setForm({ ...form, nro_comprobante: e.target.value })} placeholder="Auto si vacio" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Vencimiento</label>
                      <input type="date" className="form-control glass-input" value={form.fecha_vencimiento}
                        onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
                    </div>
                    {form.moneda === 'USD' && (
                      <div className="col-md-4">
                        <label className="form-label">Cotizacion USD <span className="text-danger">*</span></label>
                        <input type="number" step="0.01" className="form-control glass-input" value={form.cotizacion_usado}
                          onChange={e => setForm({ ...form, cotizacion_usado: e.target.value })} required />
                      </div>
                    )}
                    <div className="col-md-4">
                      <label className="form-label">Observaciones</label>
                      <input type="text" className="form-control glass-input" value={form.observaciones}
                        onChange={e => setForm({ ...form, observaciones: e.target.value })} />
                    </div>
                  </div>

                  {/* Items Section */}
                  <hr />
                  <h6>Items</h6>
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-4">
                      <label className="form-label small">Producto</label>
                      <select className="form-select form-select-sm glass-input" value={itemForm.id_producto}
                        onChange={e => setItemForm({ ...itemForm, id_producto: e.target.value })}>
                        <option value="">Seleccionar</option>
                        {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Cantidad</label>
                      <input type="number" step="0.01" className="form-control form-control-sm glass-input" value={itemForm.cantidad}
                        onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">P. Unitario</label>
                      <input type="number" step="0.01" className="form-control form-control-sm glass-input" value={itemForm.precio_unitario}
                        onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Desc %</label>
                      <input type="number" step="0.01" className="form-control form-control-sm glass-input" value={itemForm.descuento_pct}
                        onChange={e => setItemForm({ ...itemForm, descuento_pct: e.target.value })} />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-sm btn-outline-primary w-100" onClick={addItem}>
                        <i className="bi bi-plus-lg me-1"></i>Agregar
                      </button>
                    </div>
                  </div>

                  {form.items.length > 0 && (
                    <div className="glass-card p-2 mb-3">
                      <table className="table table-sm mb-0">
                        <thead><tr><th>#</th><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Desc%</th><th>Subtotal</th><th></th></tr></thead>
                        <tbody>
                          {form.items.map((item, idx) => {
                            const prod = productos.find(p => p._id === item.id_producto);
                            const subtotal = item.cantidad * item.precio_unitario * (1 - (item.descuento_pct || 0) / 100);
                            return (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{prod?.nombre || '—'}</td>
                                <td>{item.cantidad}</td>
                                <td>${item.precio_unitario.toLocaleString('es-AR')}</td>
                                <td>{item.descuento_pct || 0}%</td>
                                <td>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)}>
                                  <i className="bi bi-x"></i>
                                </button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr><td colSpan="5" className="text-end"><strong>Total:</strong></td><td><strong>${calcTotal()}</strong></td><td></td></tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">Crear Comprobante</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pago Modal */}
      {showPagoModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-coin me-2"></i>Registrar Pago</h5>
                <button type="button" className="btn-close" onClick={() => setShowPagoModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Monto del Pago</label>
                <input type="number" step="0.01" className="form-control glass-input" value={pagoMonto}
                  onChange={e => setPagoMonto(e.target.value)} autoFocus />
              </div>
              <div className="modal-footer">
                <button type="button" className="glass-btn" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button type="button" className="glass-btn glass-btn-primary" onClick={handlePago}>Confirmar Pago</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comprobantes;
