import { useState, useEffect, useCallback } from 'react';
import { listaPrecioService, precioProductoService, productoService } from '../services/api';
import { toast, confirm } from '../components/Swal';

const ListasPrecio = () => {
  const [listas, setListas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showListaModal, setShowListaModal] = useState(false);
  const [showPrecioModal, setShowPrecioModal] = useState(false);
  const [editingListaId, setEditingListaId] = useState(null);
  const [editingPrecioId, setEditingPrecioId] = useState(null);
  const [listaForm, setListaForm] = useState({ nombre: '', moneda: 'ARS', descripcion: '' });
  const [precioForm, setPrecioForm] = useState({
    id_producto: '', id_lista: '', precio: '', moneda: 'ARS',
    vigencia_desde: new Date().toISOString().split('T')[0], vigencia_hasta: ''
  });
  const [selectedLista, setSelectedLista] = useState(null);

  useEffect(() => {
    fetchListas();
    fetchProductos();
  }, []);

  useEffect(() => {
    if (selectedLista) {
      fetchPrecios(selectedLista);
    }
  }, [selectedLista]);

  const fetchListas = async () => {
    try {
      const { data } = await listaPrecioService.getAll();
      setListas(data);
      if (data.length && !selectedLista) setSelectedLista(data[0]._id);
    } catch {
      toast.error('Error al cargar listas de precios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrecios = async (listaId) => {
    try {
      const { data } = await precioProductoService.getByLista(listaId);
      setPrecios(data);
    } catch {
      toast.error('Error al cargar precios');
    }
  };

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data);
    } catch {
      toast.error('Error al cargar productos');
    }
  };

  const handleListaSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingListaId) {
        await listaPrecioService.update(editingListaId, listaForm);
        toast.success('Lista actualizada');
      } else {
        await listaPrecioService.create(listaForm);
        toast.success('Lista creada');
      }
      setShowListaModal(false);
      resetListaForm();
      fetchListas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handlePrecioSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...precioForm, vigencia_hasta: precioForm.vigencia_hasta || null };
      if (editingPrecioId) {
        await precioProductoService.update(editingPrecioId, payload);
        toast.success('Precio actualizado');
      } else {
        await precioProductoService.create(payload);
        toast.success('Precio creado');
      }
      setShowPrecioModal(false);
      resetPrecioForm();
      fetchPrecios(selectedLista);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEditLista = (lista) => {
    setListaForm({ nombre: lista.nombre, moneda: lista.moneda, descripcion: lista.descripcion || '' });
    setEditingListaId(lista._id);
    setShowListaModal(true);
  };

  const handleDeleteLista = async (id) => {
    const result = await confirm('Eliminar lista', 'Se eliminara la lista y sus precios');
    if (result.isConfirmed) {
      try {
        await listaPrecioService.delete(id);
        toast.success('Lista eliminada');
        fetchListas();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error');
      }
    }
  };

  const handleEditPrecio = (precio) => {
    setPrecioForm({
      id_producto: precio.id_producto?._id || precio.id_producto,
      id_lista: precio.id_lista?._id || precio.id_lista,
      precio: precio.precio?.$numberDecimal || precio.precio,
      moneda: precio.moneda,
      vigencia_desde: new Date(precio.vigencia_desde).toISOString().split('T')[0],
      vigencia_hasta: precio.vigencia_hasta ? new Date(precio.vigencia_hasta).toISOString().split('T')[0] : ''
    });
    setEditingPrecioId(precio._id);
    setShowPrecioModal(true);
  };

  const handleDeletePrecio = async (id) => {
    const result = await confirm('Eliminar precio', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await precioProductoService.delete(id);
        toast.success('Precio eliminado');
        fetchPrecios(selectedLista);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error');
      }
    }
  };

  const resetListaForm = () => {
    setListaForm({ nombre: '', moneda: 'ARS', descripcion: '' });
    setEditingListaId(null);
  };

  const resetPrecioForm = () => {
    setPrecioForm({
      id_producto: '', id_lista: selectedLista || '', precio: '', moneda: 'ARS',
      vigencia_desde: new Date().toISOString().split('T')[0], vigencia_hasta: ''
    });
    setEditingPrecioId(null);
  };

  const formatPrecio = (precio) => {
    const num = precio?.$numberDecimal || precio;
    return num ? Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—';
  };

  const formatDate = (date) => {
    if (!date) return 'Sin limite';
    return new Date(date).toLocaleDateString('es-AR');
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-tags me-2"></i>Listas de Precios</h4>
          <p className="text-muted mb-0">Gestiona listas de precios con vigencia por producto</p>
        </div>
        <button className="glass-btn glass-btn-primary btn" onClick={() => { resetListaForm(); setShowListaModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i>Nueva Lista
        </button>
      </div>

      {/* Lista Tabs */}
      <div className="crm-tabs mb-3">
        {listas.map(lista => (
          <button
            key={lista._id}
            className={`crm-tab ${selectedLista === lista._id ? 'active' : ''}`}
            onClick={() => setSelectedLista(lista._id)}
          >
            {lista.nombre}
            <span className={`badge bg-${lista.moneda === 'ARS' ? 'info' : 'warning'} ms-1`}>{lista.moneda}</span>
          </button>
        ))}
        {listas.length === 0 && <p className="text-muted">No hay listas de precios</p>}
      </div>

      {/* Precios Table */}
      {selectedLista && (
        <div className="glass-table mb-4">
          <div className="d-flex justify-content-between align-items-center p-3">
            <h6 className="mb-0">Precios — {listas.find(l => l._id === selectedLista)?.nombre}</h6>
            <button className="glass-btn glass-btn-primary btn btn-sm" onClick={() => {
              resetPrecioForm();
              setShowPrecioModal(true);
            }}>
              <i className="bi bi-plus-lg me-1"></i>Agregar Precio
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Precio</th>
                  <th>Vigencia Desde</th>
                  <th>Vigencia Hasta</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {precios.map(p => (
                  <tr key={p._id}>
                    <td>{p.id_producto?.nombre || '—'}</td>
                    <td><code>{p.id_producto?.sku || '—'}</code></td>
                    <td><strong>${formatPrecio(p.precio)}</strong></td>
                    <td>{formatDate(p.vigencia_desde)}</td>
                    <td>{formatDate(p.vigencia_hasta)}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditPrecio(p)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePrecio(p._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {precios.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted py-3">Sin precios en esta lista</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista Modal */}
      {showListaModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-tags me-2"></i>
                  {editingListaId ? 'Editar Lista' : 'Nueva Lista de Precios'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowListaModal(false)}></button>
              </div>
              <form onSubmit={handleListaSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input type="text" className="form-control glass-input" value={listaForm.nombre}
                      onChange={e => setListaForm({ ...listaForm, nombre: e.target.value })} required autoFocus />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Moneda <span className="text-danger">*</span></label>
                    <select className="form-select glass-input" value={listaForm.moneda}
                      onChange={e => setListaForm({ ...listaForm, moneda: e.target.value })}>
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <textarea className="form-control glass-input" value={listaForm.descripcion}
                      onChange={e => setListaForm({ ...listaForm, descripcion: e.target.value })} rows={2} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => setShowListaModal(false)}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">{editingListaId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Precio Modal */}
      {showPrecioModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-currency-dollar me-2"></i>
                  {editingPrecioId ? 'Editar Precio' : 'Nuevo Precio'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPrecioModal(false)}></button>
              </div>
              <form onSubmit={handlePrecioSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Producto <span className="text-danger">*</span></label>
                    <select className="form-select glass-input" value={precioForm.id_producto}
                      onChange={e => setPrecioForm({ ...precioForm, id_producto: e.target.value })} required>
                      <option value="">Seleccionar producto</option>
                      {productos.filter(p => p.activo).map(p => (
                        <option key={p._id} value={p._id}>{p.nombre} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Precio <span className="text-danger">*</span></label>
                        <input type="number" step="0.01" className="form-control glass-input" value={precioForm.precio}
                          onChange={e => setPrecioForm({ ...precioForm, precio: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Moneda</label>
                        <select className="form-select glass-input" value={precioForm.moneda}
                          onChange={e => setPrecioForm({ ...precioForm, moneda: e.target.value })}>
                          <option value="ARS">ARS</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Vigencia Desde <span className="text-danger">*</span></label>
                        <input type="date" className="form-control glass-input" value={precioForm.vigencia_desde}
                          onChange={e => setPrecioForm({ ...precioForm, vigencia_desde: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Vigencia Hasta</label>
                        <input type="date" className="form-control glass-input" value={precioForm.vigencia_hasta}
                          onChange={e => setPrecioForm({ ...precioForm, vigencia_hasta: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => setShowPrecioModal(false)}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">{editingPrecioId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListasPrecio;
