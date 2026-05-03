import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { comprobanteService, cuentaCorrienteService, productoService } from '../services/api';
import { comprobanteSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import { FormInput, FormSelect, FormNumber, FormDate, FormModal, SearchableSelect } from '../components/form';
import { FilterBar, FilterItem, StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const Comprobantes = () => {
  const [comprobantes, setComprobantes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ origen: 'compra', tipo: '', estado: '', moneda: '' });
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoId, setPagoId] = useState(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
  const [comprobanteItems, setComprobanteItems] = useState([]);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(comprobanteSchema),
    defaultValues: {
      id_cuenta: '', tipo: 'FACT', origen: 'compra', moneda: 'ARS',
      nro_comprobante: '', fecha_vencimiento: '', cotizacion_usado: '',
      observaciones: '', id_remito_origen: '', items: [],
    },
  });

  const moneda = watch('moneda');

  useEffect(() => {
    fetchComprobantes();
    fetchCuentas();
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
      setComprobantes(res.data?.data || res.data || []);
    } catch { toast.error('Error al cargar comprobantes'); }
    finally { setLoading(false); }
  };

  const fetchCuentas = async () => {
    try {
      const res = await cuentaCorrienteService.getAll();
      setCuentas(res.data?.data || res.data || []);
    } catch { toast.error('Error al cargar cuentas'); }
  };

  const fetchProductos = async () => {
    try {
      const res = await productoService.getAll();
      setProductos(res.data?.data || res.data || []);
    } catch { toast.error('Error al cargar productos'); }
  };

  const onSubmit = async (data) => {
    if (!comprobanteItems.length) {
      toast.error('Agrega al menos un item al comprobante');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...data, items: comprobanteItems };
      const res = await comprobanteService.create(payload);
      const created = res.data?.data || res.data;
      toast.success(`Comprobante ${created.nro_comprobante} creado`);
      setShowModal(false);
      reset();
      setComprobanteItems([]);
      setItemForm({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear');
    } finally {
      setIsSubmitting(false);
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
    setComprobanteItems([...comprobanteItems, {
      id_producto: itemForm.id_producto,
      cantidad: Number(itemForm.cantidad),
      precio_unitario: Number(itemForm.precio_unitario),
      descuento_pct: Number(itemForm.descuento_pct) || 0,
      moneda: moneda,
    }]);
    setItemForm({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 });
  };

  const removeItem = (idx) => {
    setComprobanteItems(comprobanteItems.filter((_, i) => i !== idx));
  };

  const calcTotal = () => {
    return comprobanteItems.reduce((sum, item) => {
      const bruto = item.cantidad * item.precio_unitario;
      const desc = bruto * (item.descuento_pct / 100);
      return sum + (bruto - desc);
    }, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  };

  const getTerceroName = (cuenta) => {
    const t = cuenta?.id_tercero;
    return t?.razon_social || t?.nombre || '—';
  };

  if (loading) return <LoadingOverlay text="Cargando comprobantes..." />;

  const cuentaOptions = cuentas.filter(c => c.activa).map(c => ({
    value: c._id,
    label: `${getTerceroName(c)} — ${c.tipo} ${c.moneda}`
  }));

  const tipoOptions = [
    { value: 'FACT', label: 'FACT' }, { value: 'REM', label: 'REM' },
    { value: 'NC', label: 'NC' }, { value: 'ND', label: 'ND' },
    { value: 'REC', label: 'REC' }, { value: 'SENIA', label: 'SENIA' },
  ];

  const monedaOptions = [{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }];
  const productoSelectOptions = productos.filter(p => p.activo);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-receipt me-2"></i>Comprobantes</h4>
          <p className="text-muted mb-0">Facturas, remitos, notas de credito y mas</p>
        </div>
        <button className="glass-btn glass-btn-primary btn" onClick={() => { reset(); setComprobanteItems([]); setItemForm({ id_producto: '', cantidad: '', precio_unitario: '', descuento_pct: 0 }); setShowModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i>Nuevo Comprobante
        </button>
      </div>

      {/* Filtros */}
      <FilterBar>
        <FilterItem label="Origen">
          <select className="form-select form-select-sm glass-input" value={filters.origen}
            onChange={e => setFilters({ ...filters, origen: e.target.value })}>
            <option value="compra">Compra</option><option value="venta">Venta</option>
          </select>
        </FilterItem>
        <FilterItem label="Tipo">
          <select className="form-select form-select-sm glass-input" value={filters.tipo}
            onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="FACT">FACT</option><option value="REM">REM</option>
            <option value="NC">NC</option><option value="ND">ND</option>
            <option value="REC">REC</option><option value="SENIA">SENIA</option>
          </select>
        </FilterItem>
        <FilterItem label="Estado">
          <select className="form-select form-select-sm glass-input" value={filters.estado}
            onChange={e => setFilters({ ...filters, estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="cancelado">Cancelado</option>
          </select>
        </FilterItem>
        <FilterItem label="Moneda">
          <select className="form-select form-select-sm glass-input" value={filters.moneda}
            onChange={e => setFilters({ ...filters, moneda: e.target.value })}>
            <option value="">Todas</option>
            <option value="ARS">ARS</option><option value="USD">USD</option>
          </select>
        </FilterItem>
      </FilterBar>

      {/* Tabla */}
      <div className="glass-table">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead>
              <tr>
                <th></th><th>Tipo</th><th>Nro</th><th>Tercero</th><th>Fecha</th><th>Vencimiento</th>
                <th>Moneda</th><th>Total</th><th>Saldo</th><th>Estado</th><th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.length === 0 ? (
                <tr><td colSpan="11"><EmptyState icon="receipt" title="No hay comprobantes" /></td></tr>
              ) : comprobantes.map(c => (
                <>
                  <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}>
                    <td><i className={`bi bi-chevron-${expandedId === c._id ? 'down' : 'right'}`}></i></td>
                    <td><StatusBadge value={c.tipo} /></td>
                    <td><code>{c.nro_comprobante}</code></td>
                    <td>{getTerceroName(c.id_cuenta)}</td>
                    <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                    <td>{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-AR') : '—'}</td>
                    <td><StatusBadge value={c.moneda} /></td>
                    <td><strong>${Number(c.monto_original?.$numberDecimal || c.monto_original || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
                    <td>${Number(c.saldo_pendiente?.$numberDecimal || c.saldo_pendiente || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td><StatusBadge value={c.estado} /></td>
                    <td className="text-end" onClick={e => e.stopPropagation()}>
                      {c.estado !== 'cancelado' && c.tipo === 'FACT' && (
                        <button className="btn btn-sm btn-outline-success me-1" title="Pagar"
                          onClick={() => { setPagoId(c._id); setPagoMonto(c.saldo_pendiente?.$numberDecimal || c.saldo_pendiente || ''); setShowPagoModal(true); }}>
                          <i className="bi bi-cash"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger" title="Anular" onClick={() => handleAnular(c._id)}>
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Comprobante */}
      <FormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); reset(); setComprobanteItems([]); }}
        title="Nuevo Comprobante"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="xl"
      >
        <div className="row g-3">
          <div className="col-md-4">
            <Controller name="id_cuenta" control={control} render={({ field }) => (
              <FormSelect label="Cuenta Corriente" options={cuentaOptions} {...field} error={errors.id_cuenta?.message} required />
            )} />
          </div>
          <div className="col-md-2">
            <Controller name="tipo" control={control} render={({ field }) => (
              <FormSelect label="Tipo" options={tipoOptions} {...field} />
            )} />
          </div>
          <div className="col-md-2">
            <Controller name="moneda" control={control} render={({ field }) => (
              <FormSelect label="Moneda" options={monedaOptions} {...field} />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="nro_comprobante" control={control} render={({ field }) => (
              <FormInput label="Nro Comprobante" {...field} placeholder="Auto si vacio" />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="fecha_vencimiento" control={control} render={({ field }) => (
              <FormDate label="Vencimiento" {...field} />
            )} />
          </div>
          {moneda === 'USD' && (
            <div className="col-md-4">
              <Controller name="cotizacion_usado" control={control} render={({ field }) => (
                <FormNumber label="Cotizacion USD" {...field} error={errors.cotizacion_usado?.message} required step="0.01" />
              )} />
            </div>
          )}
          <div className="col-md-4">
            <Controller name="observaciones" control={control} render={({ field }) => (
              <FormInput label="Observaciones" {...field} />
            )} />
          </div>
        </div>

        {/* Items Section */}
        <hr />
        <h6>Items</h6>
        <div className="row g-2 align-items-end mb-3">
          <div className="col-md-4">
            <SearchableSelect label="Producto" options={productoSelectOptions}
              value={itemForm.id_producto} onChange={v => setItemForm({ ...itemForm, id_producto: v })}
              displayKey="nombre" valueKey="_id" placeholder="Seleccionar" />
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

        {comprobanteItems.length > 0 && (
          <div className="glass-card p-2 mb-3">
            <table className="table table-sm mb-0">
              <thead><tr><th>#</th><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Desc%</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {comprobanteItems.map((item, idx) => {
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
                      <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)}><i className="bi bi-x"></i></button></td>
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
      </FormModal>

      {/* Pago Modal */}
      <FormModal
        isOpen={showPagoModal}
        onClose={() => { setShowPagoModal(false); setPagoId(null); setPagoMonto(''); }}
        title="Registrar Pago"
        onSubmit={handlePago}
        submitLabel="Confirmar Pago"
        size="sm"
      >
        <label className="form-label">Monto del Pago</label>
        <input type="number" step="0.01" className="form-control glass-input" value={pagoMonto}
          onChange={e => setPagoMonto(e.target.value)} autoFocus />
      </FormModal>
    </div>
  );
};

export default Comprobantes;
