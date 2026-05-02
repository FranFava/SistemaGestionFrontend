import { useState, useEffect } from 'react';
import { clienteService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';

const CRMClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '', instagram: '' });

  useEffect(() => {
    clienteService.getAll()
      .then(({ data }) => setClientes(data))
      .catch(() => toast.error('Error al cargar clientes'));
  }, []);

  const fetchClientes = async () => {
    try {
      const { data } = await clienteService.getAll();
      setClientes(data);
    } catch {
      toast.error('Error al cargar clientes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await clienteService.update(editingId, form);
        toast.success('Cliente actualizado');
      } else {
        await clienteService.create(form);
        toast.success('Cliente creado');
      }
      setShowModal(false);
      resetForm();
      fetchClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (c) => {
    setForm({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      email: c.email || '',
      direccion: c.direccion || '',
      instagram: c.instagram || ''
    });
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('¿Eliminar cliente?', 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await clienteService.delete(id);
        toast.success('Cliente eliminado');
        fetchClientes();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', telefono: '', email: '', direccion: '', instagram: '' });
    setEditingId(null);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentClientes = clientes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(clientes.length / itemsPerPage);

  const exportData = () => {
    const columns = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Instagram'].map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentClientes.map(c => ({
      nombre: c.nombre,
      teléfono: c.telefono,
      email: c.email,
      dirección: c.direccion,
      instagram: c.instagram
    }));
    exportToExcel(data, 'clientes', columns);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0">
          <i className="bi bi-people me-2"></i>CRM — Clientes
        </h2>
        <div className="d-flex flex-wrap gap-2">
          <button className="view-toggle-btn" onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}>
            <i className={`bi bi-${viewMode === 'cards' ? 'table' : 'grid'} me-1`}></i>
            {viewMode === 'cards' ? 'Tabla' : 'Cards'}
          </button>
          <button className="glass-btn" onClick={exportData}><i className="bi bi-file-excel me-1"></i><span className="d-none d-sm-inline">Exportar</span></button>
          <button className="glass-btn glass-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="row g-3 mb-4">
          {currentClientes.map(c => (
            <div key={c._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className="badge bg-info">CLIENTE</span>
                  <div className="crm-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(c)} title="Editar"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
                  </div>
                </div>
                <p className="crm-card-name">{c.nombre}</p>
                {c.telefono && <div className="crm-card-field"><i className="bi bi-telephone"></i><span>{c.telefono}</span></div>}
                {c.email && <div className="crm-card-field"><i className="bi bi-envelope"></i><span>{c.email}</span></div>}
                {c.instagram && <div className="crm-card-field"><i className="bi bi-instagram"></i><span>{c.instagram}</span></div>}
                {c.direccion && <div className="crm-card-field"><i className="bi bi-geo-alt"></i><span>{c.direccion}</span></div>}
              </div>
            </div>
          ))}
          {clientes.length === 0 && (
            <div className="col-12 text-center py-5">
              <i className="bi bi-people" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)' }}></i>
              <p className="text-glass-muted mt-2">No hay clientes registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-table mb-4">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Instagram</th><th>Dirección</th><th>Acciones</th></tr></thead>
              <tbody>
                {currentClientes.map(c => (
                  <tr key={c._id}>
                    <td>{c.nombre}</td>
                    <td>{c.telefono}</td>
                    <td>{c.email}</td>
                    <td>{c.instagram}</td>
                    <td>{c.direccion}</td>
                    <td>
                      <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(c)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <p className="text-glass-muted small mt-2">Mostrando {currentClientes.length} de {clientes.length} clientes</p>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>{editingId ? 'Editar' : 'Nuevo'} Cliente</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="mb-3"><label className="form-label">Nombre *</label><input className="glass-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
                  <div className="mb-3"><label className="form-label">Teléfono</label><input className="glass-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Email</label><input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Instagram</label><input className="glass-input" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Dirección</label><input className="glass-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMClientes;
