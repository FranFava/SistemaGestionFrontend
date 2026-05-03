import { useState, useEffect } from 'react';
import { movimientoStockService, productoService } from '../services/api';
import { toast } from '../components/Swal';
import { FilterBar, FilterItem, StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const Stock = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ id_producto: '', tipo: '', deposito: 'Central' });

  useEffect(() => {
    fetchMovimientos();
    fetchProductos();
  }, [filters]);

  useEffect(() => {
    if (filters.id_producto) {
      fetchStock(filters.id_producto);
    }
  }, [filters.id_producto, filters.deposito]);

  const fetchMovimientos = async () => {
    try {
      const params = {};
      if (filters.id_producto) params.id_producto = filters.id_producto;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.deposito) params.deposito = filters.deposito;
      const res = await movimientoStockService.getAll(params);
      const arr = res.data?.data || res.data || [];
      setMovimientos(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await productoService.getAll();
      const arr = res.data?.data || res.data || [];
      setProductos(Array.isArray(arr) ? arr.filter(p => p.activo) : []);
    } catch { toast.error('Error al cargar productos'); }
  };

  const fetchStock = async (productoId) => {
    try {
      const res = await movimientoStockService.getStockActual(productoId, filters.deposito);
      setStock(res.data?.data || res.data || {});
    } catch { setStock({}); }
  };

  const tipoIcon = (tipo) => {
    if (tipo === 'entrada') return <i className="bi bi-arrow-down-circle text-success me-1"></i>;
    if (tipo === 'salida') return <i className="bi bi-arrow-up-circle text-danger me-1"></i>;
    return <i className="bi bi-gear text-warning me-1"></i>;
  };

  if (loading) return <LoadingOverlay text="Cargando stock..." />;

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="mb-1"><i className="bi bi-box-seam me-2"></i>Stock / Inventario</h4>
        <p className="text-muted mb-0">Movimientos de stock generados automaticamente por comprobantes</p>
      </div>

      {/* Stock Card */}
      {filters.id_producto && (
        <div className="glass-card p-4 mb-4">
          <h6 className="mb-3">
            <i className="bi bi-clipboard-data me-2"></i>
            Stock Actual — {productos.find(p => p._id === filters.id_producto)?.nombre}
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="glass-card p-3 text-center">
                <small className="text-muted">Entradas</small>
                <h3 className="text-success mb-0">{stock.entradas || 0}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center">
                <small className="text-muted">Salidas</small>
                <h3 className="text-danger mb-0">{stock.salidas || 0}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center">
                <small className="text-muted">Stock Neto</small>
                <h3 className={`mb-0 ${stock.stock >= 0 ? 'text-info' : 'text-danger'}`}>{stock.stock || 0}</h3>
              </div>
            </div>
          </div>
          <small className="text-muted mt-2 d-block">Deposito: {filters.deposito}</small>
        </div>
      )}

      {/* Filtros */}
      <FilterBar>
        <FilterItem label="Producto">
          <select className="form-select form-select-sm glass-input" value={filters.id_producto}
            onChange={e => setFilters({ ...filters, id_producto: e.target.value })}>
            <option value="">Todos los productos</option>
            {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.sku})</option>)}
          </select>
        </FilterItem>
        <FilterItem label="Tipo">
          <select className="form-select form-select-sm glass-input" value={filters.tipo}
            onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </FilterItem>
        <FilterItem label="Deposito">
          <select className="form-select form-select-sm glass-input" value={filters.deposito}
            onChange={e => setFilters({ ...filters, deposito: e.target.value })}>
            <option value="Central">Central</option>
          </select>
        </FilterItem>
      </FilterBar>

      {/* Movimientos Table */}
      <div className="glass-table">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead>
              <tr>
                <th></th><th>Tipo</th><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Comprobante</th><th>Origen</th><th>Fecha</th><th>Deposito</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr><td colSpan="9"><EmptyState icon="box-seam" title="No hay movimientos de stock" /></td></tr>
              ) : movimientos.map(m => (
                <tr key={m._id}>
                  <td>{tipoIcon(m.tipo)}</td>
                  <td><StatusBadge value={m.tipo} /></td>
                  <td>{m.id_producto?.nombre || '—'}</td>
                  <td><code>{m.id_producto?.sku || '—'}</code></td>
                  <td><strong>{m.cantidad?.$numberDecimal || m.cantidad}</strong></td>
                  <td>{m.id_comprobante ? <code>{m.id_comprobante.tipo} {m.id_comprobante.nro_comprobante}</code> : '—'}</td>
                  <td>{m.id_comprobante?.origen ? <StatusBadge value={m.id_comprobante.origen} /> : '—'}</td>
                  <td>{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{m.deposito}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
