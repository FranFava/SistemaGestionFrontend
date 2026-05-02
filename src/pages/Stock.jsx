import { useState, useEffect, useCallback } from 'react';
import { movimientoStockService, productoService } from '../services/api';
import { toast } from '../components/Swal';

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
      const { data } = await movimientoStockService.getAll(params);
      setMovimientos(data);
    } catch {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data.filter(p => p.activo));
    } catch { toast.error('Error al cargar productos'); }
  };

  const fetchStock = async (productoId) => {
    try {
      const { data } = await movimientoStockService.getStockActual(productoId, filters.deposito);
      setStock(data);
    } catch { setStock({}); }
  };

  const tipoIcon = (tipo) => {
    if (tipo === 'entrada') return <i className="bi bi-arrow-down-circle text-success me-1"></i>;
    if (tipo === 'salida') return <i className="bi bi-arrow-up-circle text-danger me-1"></i>;
    return <i className="bi bi-gear text-warning me-1"></i>;
  };

  const tipoBadge = (tipo) => {
    const colors = { entrada: 'success', salida: 'danger', ajuste: 'warning' };
    return <span className={`badge bg-${colors[tipo] || 'secondary'}`}>{tipo}</span>;
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

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
      <div className="glass-card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label small text-muted">Producto</label>
            <select className="form-select form-select-sm glass-input" value={filters.id_producto}
              onChange={e => setFilters({ ...filters, id_producto: e.target.value })}>
              <option value="">Todos los productos</option>
              {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.sku})</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small text-muted">Tipo</label>
            <select className="form-select form-select-sm glass-input" value={filters.tipo}
              onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small text-muted">Deposito</label>
            <select className="form-select form-select-sm glass-input" value={filters.deposito}
              onChange={e => setFilters({ ...filters, deposito: e.target.value })}>
              <option value="Central">Central</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movimientos Table */}
      <div className="glass-table">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead>
              <tr>
                <th></th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cantidad</th>
                <th>Comprobante</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th>Deposito</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m._id}>
                  <td>{tipoIcon(m.tipo)}</td>
                  <td>{tipoBadge(m.tipo)}</td>
                  <td>{m.id_producto?.nombre || '—'}</td>
                  <td><code>{m.id_producto?.sku || '—'}</code></td>
                  <td><strong>{m.cantidad?.$numberDecimal || m.cantidad}</strong></td>
                  <td>
                    {m.id_comprobante ? (
                      <code>{m.id_comprobante.tipo} {m.id_comprobante.nro_comprobante}</code>
                    ) : '—'}
                  </td>
                  <td>
                    {m.id_comprobante?.origen ? (
                      <span className={`badge bg-${m.id_comprobante.origen === 'compra' ? 'success' : 'primary'}`}>
                        {m.id_comprobante.origen}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{m.deposito}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted py-4">No hay movimientos de stock</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
