import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cajaService } from '../services/api';
import { toast } from '../components/Swal';
import Pagination from '../components/Pagination';
import { useDollar } from '../context/DollarContext';
import { FormInput, FormSelect, FormModal } from '../components/form';
import { PageHeader, FilterBar, FilterItem, LoadingOverlay } from '../components/ui';

const tipoOperacionLabels = {
  venta: 'Venta', compra_proveedor: 'Compra a Proveedor', gasto: 'Gasto',
  compra_interna: 'Compra Interna', recibido_pp: 'Recibido PP', pago_cuenta: 'Pago de Cuenta'
};

const tipoOperacionColores = {
  venta: 'success', compra_proveedor: 'primary', gasto: 'danger',
  compra_interna: 'info', recibido_pp: 'warning', pago_cuenta: 'secondary'
};

const cajaMovimientoSchema = {
  tipo: v => (v ? undefined : 'Selecciona un tipo'),
  metodoPago: v => (v ? undefined : 'Selecciona un metodo'),
  moneda: v => (v ? undefined : 'Selecciona una moneda'),
  monto: v => (v && Number(v) > 0 ? undefined : 'El monto debe ser mayor a 0'),
  concepto: v => (v ? undefined : 'El concepto es obligatorio'),
  tipoOperacion: v => (v ? undefined : 'Selecciona una operacion'),
};

const Caja = () => {
  const { cotizacionDolar, updateCotizacion } = useDollar();
  const [movimientos, setMovimientos] = useState([]);
  const [saldos, setSaldos] = useState({
    saldoPesosEfectivo: 0, saldoPesosTransfer: 0,
    saldoDolaresEfectivo: 0, saldoDolaresTransfer: 0,
    saldoTotalPesos: 0, saldoTotalDolares: 0, cotizacionDolar: 1000
  });
  const [showModal, setShowModal] = useState(false);
  const [showCotizacionModal, setShowCotizacionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', tipo: '', metodoPago: '', moneda: '' });
  const [nuevaCotizacion, setNuevaCotizacion] = useState(() => cotizacionDolar.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(cajaMovimientoSchema),
    defaultValues: { tipo: 'ingreso', metodoPago: 'efectivo', moneda: 'ARS', monto: '', montoUSD: '', concepto: '', tipoOperacion: 'venta' },
  });

  const moneda = watch('moneda');
  const monto = watch('monto');

  const fetchSaldos = useCallback(async () => {
    try {
      const response = await cajaService.getSaldos();
      const data = response.data?.data || response.data || {};
      setSaldos({
        saldoPesosEfectivo: data.saldoPesosEfectivo || 0,
        saldoPesosTransfer: data.saldoPesosTransfer || 0,
        saldoDolaresEfectivo: data.saldoDolaresEfectivo || 0,
        saldoDolaresTransfer: data.saldoDolaresTransfer || 0,
        saldoTotalPesos: data.saldoTotalPesos || 0,
        saldoTotalDolares: data.saldoTotalDolares || 0,
        cotizacionDolar: data.cotizacionDolar || 1000
      });
      setNuevaCotizacion((data.cotizacionDolar || 1000).toString());
    } catch { toast.error('Error al cargar saldos'); }
  }, []);

  const fetchMovimientos = useCallback(async () => {
    try {
      const params = {};
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.metodoPago) params.metodoPago = filters.metodoPago;
      if (filters.moneda) params.moneda = filters.moneda;
      const response = await cajaService.getAll(params);
      const data = response.data?.data || response.data || [];
      setMovimientos(Array.isArray(data) ? data : []);
    } catch {
      setMovimientos([]);
      toast.error('Error al cargar movimientos de caja');
    }
  }, [filters]);

  useEffect(() => {
    fetchMovimientos();
    fetchSaldos();
  }, [fetchMovimientos, fetchSaldos]);

  useEffect(() => {
    setNuevaCotizacion(cotizacionDolar.toString());
  }, [cotizacionDolar]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await cajaService.create({
        ...data,
        monto: Number(data.monto),
        montoUSD: data.moneda === 'USD' ? Number(data.montoUSD) : 0
      });
      toast.success('Movimiento registrado');
      setShowModal(false);
      reset();
      fetchMovimientos();
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCotizacion = async (e) => {
    e.preventDefault();
    try {
      await updateCotizacion(Number(nuevaCotizacion));
      toast.success('Cotizacion actualizada a ' + Number(nuevaCotizacion).toLocaleString('es-AR') + ' ARS');
      setShowCotizacionModal(false);
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar cotizacion');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Estas seguro de eliminar este movimiento?')) return;
    try {
      await cajaService.delete(id);
      toast.success('Movimiento eliminado');
      fetchMovimientos();
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovimientos();
  };

  const handleMonedaChange = (monedaVal) => {
    setValue('moneda', monedaVal);
    if (monedaVal === 'USD' && monto && cotizacionDolar) {
      setValue('montoUSD', (Number(monto) / cotizacionDolar).toFixed(2));
    } else if (monedaVal === 'ARS') {
      setValue('montoUSD', '');
    }
  };

  const formatCurrency = (value, m) => `${m === 'USD' ? 'USD' : '$'}${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = movimientos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(movimientos.length / itemsPerPage);

  const tipoOperacionOptions = Object.entries(tipoOperacionLabels).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader
        icon="cash-coin"
        title="Caja"
        actions={
          <button className="glass-btn glass-btn-primary btn" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Nuevo
          </button>
        }
      />

      {/* Banner de cotizacion */}
      <div className="glass-alert alert d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <span className="mb-2 mb-sm-0">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Cotizacion:</strong> 1 USD = {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCotizacionModal(true)}>
          <i className="bi bi-pencil-square me-1"></i>Actualizar
        </button>
      </div>

      {/* Tarjetas de saldos */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-cash text-success me-1"></i> Efectivo ARS</h6>
              <h4 className="text-success">{formatCurrency(saldos.saldoPesosEfectivo, 'ARS')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-bank text-info me-1"></i> Transferencia ARS</h6>
              <h4 className="text-info">{formatCurrency(saldos.saldoPesosTransfer, 'ARS')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-currency-dollar text-warning me-1"></i> Efectivo USD</h6>
              <h4 className="text-warning">{formatCurrency(saldos.saldoDolaresEfectivo, 'USD')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-credit-card text-light me-1"></i> Transferencia USD</h6>
              <h4 className="text-light">{formatCurrency(saldos.saldoDolaresTransfer, 'USD')}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="glass-card card border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-currency-exchange me-1"></i> Total en Pesos (ARS)</h6>
              <h3 className="text-white">{formatCurrency(saldos.saldoTotalPesos, 'ARS')}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="glass-card card border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted"><i className="bi bi-currency-bitcoin me-1"></i> Total en Dolares (USD)</h6>
              <h3 className="text-white">{formatCurrency(saldos.saldoTotalDolares, 'USD')}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFilter}>
        <FilterBar>
          <FilterItem label="Desde">
            <input type="date" className="form-control form-control-sm glass-input" value={filters.fechaInicio}
              onChange={e => setFilters({ ...filters, fechaInicio: e.target.value })} />
          </FilterItem>
          <FilterItem label="Hasta">
            <input type="date" className="form-control form-control-sm glass-input" value={filters.fechaFin}
              onChange={e => setFilters({ ...filters, fechaFin: e.target.value })} />
          </FilterItem>
          <FilterItem label="Tipo">
            <select className="form-select form-select-sm" value={filters.tipo} onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
              <option value="">Tipo</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </FilterItem>
          <FilterItem label="Metodo">
            <select className="form-select form-select-sm" value={filters.metodoPago} onChange={e => setFilters({ ...filters, metodoPago: e.target.value })}>
              <option value="">Metodo</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </FilterItem>
          <FilterItem label="Moneda">
            <select className="form-select form-select-sm" value={filters.moneda} onChange={e => setFilters({ ...filters, moneda: e.target.value })}>
              <option value="">Moneda</option>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </FilterItem>
          <div className="col-md-2">
            <button type="submit" className="glass-btn w-100"><i className="bi bi-funnel"></i></button>
          </div>
        </FilterBar>
      </form>

      {/* Tabla */}
      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-striped table-sm mb-0">
          <thead>
            <tr>
              <th><i className="bi bi-calendar3 me-1"></i>Fecha</th>
              <th><i className="bi bi-arrow-left-right me-1"></i>Tipo</th>
              <th><i className="bi bi-gear me-1"></i>Operacion</th>
              <th><i className="bi bi-box me-1"></i>Producto</th>
              <th><i className="bi bi-person me-1"></i>Cliente</th>
              <th><i className="bi bi-credit-card me-1"></i>Metodo</th>
              <th><i className="bi bi-currency-exchange me-1"></i>Moneda</th>
              <th><i className="bi bi-cash me-1"></i>Monto</th>
              <th><i className="bi bi-text-left me-1"></i>Concepto</th>
              <th><i className="bi bi-person me-1"></i>Usuario</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentMovimientos.map(mov => (
              <tr key={mov._id}>
                <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={`badge bg-${mov.tipo === 'ingreso' ? 'success' : 'danger'}`}>
                    {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${tipoOperacionColores[mov.tipoOperacion] || 'secondary'}`}>
                    {tipoOperacionLabels[mov.tipoOperacion] || mov.tipoOperacion}
                  </span>
                </td>
                <td>{mov.referencia?.id?.producto?.nombre || '-'}</td>
                <td>{mov.referencia?.id?.cliente ? `${mov.referencia.id.cliente.nombre} ${mov.referencia.id.cliente.apellido || ''}` : '-'}</td>
                <td>{mov.metodoPago}</td>
                <td>{mov.moneda}</td>
                <td>{formatCurrency(mov.monto, mov.moneda)}</td>
                <td>{mov.concepto}</td>
                <td>{mov.usuario?.nombre || mov.usuario?.username || '-'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(mov._id)} title="Eliminar" style={{ padding: '4px 8px' }}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
            {currentMovimientos.length === 0 && (
              <tr><td colSpan="11" className="text-center text-muted py-4">No hay movimientos</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <p className="text-glass-muted">Mostrando {currentMovimientos.length} de {movimientos.length} registros</p>

      {/* Modal: Nuevo Movimiento */}
      <FormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); reset(); }}
        title="Nuevo Movimiento de Caja"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        {/* Tipo: Ingreso/Egreso */}
        <div className="mb-3">
          <label className="form-label">Tipo *</label>
          <div className="d-flex gap-2">
            <button type="button" className={`btn ${watch('tipo') === 'ingreso' ? 'btn-success' : 'glass-btn'} flex-fill`}
              onClick={() => setValue('tipo', 'ingreso')}>
              <i className="bi bi-arrow-down-circle me-1"></i>Ingreso
            </button>
            <button type="button" className={`btn ${watch('tipo') === 'egreso' ? 'btn-danger' : 'glass-btn'} flex-fill`}
              onClick={() => setValue('tipo', 'egreso')}>
              <i className="bi bi-arrow-up-circle me-1"></i>Egreso
            </button>
          </div>
        </div>

        {/* Operacion */}
        <Controller name="tipoOperacion" control={control} render={({ field }) => (
          <FormSelect label="Operacion" options={tipoOperacionOptions} {...field} error={errors.tipoOperacion?.message} required />
        )} />

        {/* Metodo de pago */}
        <div className="mb-3">
          <label className="form-label">Metodo de Pago *</label>
          <div className="d-flex gap-2">
            <button type="button" className={`btn ${watch('metodoPago') === 'efectivo' ? 'btn-primary' : 'glass-btn'} flex-fill`}
              onClick={() => setValue('metodoPago', 'efectivo')}>
              <i className="bi bi-cash me-1"></i>Efectivo
            </button>
            <button type="button" className={`btn ${watch('metodoPago') === 'transferencia' ? 'btn-primary' : 'glass-btn'} flex-fill`}
              onClick={() => setValue('metodoPago', 'transferencia')}>
              <i className="bi bi-bank me-1"></i>Transferencia
            </button>
          </div>
        </div>

        {/* Moneda */}
        <div className="mb-3">
          <label className="form-label">Moneda *</label>
          <div className="d-flex gap-2">
            <button type="button" className={`btn ${moneda === 'ARS' ? 'btn-warning' : 'glass-btn'} flex-fill`}
              onClick={() => handleMonedaChange('ARS')}>ARS</button>
            <button type="button" className={`btn ${moneda === 'USD' ? 'btn-warning' : 'glass-btn'} flex-fill`}
              onClick={() => handleMonedaChange('USD')}>USD</button>
          </div>
          {moneda === 'USD' && (
            <small className="text-glass-muted">Cotizacion: 1 USD = {Number(cotizacionDolar).toLocaleString('es-AR')} ARS</small>
          )}
        </div>

        {/* Monto */}
        <div className="mb-3">
          <label className="form-label">Monto *</label>
          <div className="input-group">
            <span className="input-group-text">{moneda === 'USD' ? 'USD' : '$'}</span>
            <input type="number" className="form-control glass-input" value={monto}
              onChange={e => {
                const val = e.target.value;
                setValue('monto', val);
                if (moneda === 'USD' && cotizacionDolar) {
                  setValue('montoUSD', val ? (Number(val) / cotizacionDolar).toFixed(2) : '');
                }
              }}
              min="0" step="0.01" required />
          </div>
          {errors.monto && <div className="invalid-feedback d-block">{errors.monto.message}</div>}
        </div>

        {/* Monto USD */}
        {moneda === 'USD' && (
          <div className="mb-3">
            <label className="form-label">Monto en Dolares</label>
            <div className="input-group">
              <span className="input-group-text">USD</span>
              <Controller name="montoUSD" control={control} render={({ field }) => (
                <input type="number" className="form-control glass-input" {...field} min="0" step="0.01" />
              )} />
            </div>
          </div>
        )}

        {/* Concepto */}
        <Controller name="concepto" control={control} render={({ field }) => (
          <FormInput label="Concepto" {...field} error={errors.concepto?.message} required />
        )} />
      </FormModal>

      {/* Modal: Actualizar Cotizacion */}
      <FormModal
        isOpen={showCotizacionModal}
        onClose={() => setShowCotizacionModal(false)}
        title="Actualizar Cotizacion USD"
        onSubmit={handleUpdateCotizacion}
        size="sm"
      >
        <div className="mb-3">
          <label className="form-label">Cotizacion del Dia (ARS)</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input type="number" className="form-control glass-input" value={nuevaCotizacion}
              onChange={e => setNuevaCotizacion(e.target.value)} min="1" required />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default Caja;
