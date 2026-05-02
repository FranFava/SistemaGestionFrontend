import { useState, useEffect } from 'react';
import { clienteService, proveedorService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';

const CRM = () => {
  const [activeTab, setActiveTab] = useState('clientes');

  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState('cliente');
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const [formType, setFormType] = useState('cliente');
  const [form, setForm] = useState({
    nombre: '', telefono: '', email: '', direccion: '',
    instagram: '', rut: '', contacto: ''
  });

  const isCliente = activeTab === 'clientes';
  const currentData = isCliente ? clientes : proveedores;
  const badgeClass = isCliente ? 'bg-info' : 'bg-success';
  const badgeLabel = isCliente ? 'CLIENTE' : 'PROVEEDOR';
  const icon = isCliente ? 'people' : 'truck';
  const service = isCliente ? clienteService : proveedorService;

  useEffect(() => {
    service.getAll()
      .then(({ data }) => {
        if (isCliente) setClientes(data);
        else setProveedores(data);
      })
      .catch(() => toast.error(`Error al cargar ${isCliente ? 'clientes' : 'proveedores'}`));
  }, [activeTab, isCliente, service]);

  const refreshData = async () => {
    try {
      const { data } = await service.getAll();
      if (isCliente) setClientes(data);
      else setProveedores(data);
    } catch {
      toast.error(`Error al cargar ${isCliente ? 'clientes' : 'proveedores'}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isAmbos = formType === 'ambos';
      const isCli = formType === 'cliente' || isAmbos;
      const isProv = formType === 'proveedor' || isAmbos;

      if (editingId) {
        if (isCli) {
          await clienteService.update(editingId, {
            nombre: form.nombre,
            telefono: form.telefono,
            email: form.email,
            direccion: form.direccion,
            instagram: form.instagram
          });
        }
        if (isProv) {
          await proveedorService.update(editingId, {
            nombre: form.nombre,
            rut: form.rut,
            telefono: form.telefono,
            email: form.email,
            direccion: form.direccion,
            contacto: form.contacto
          });
        }
        toast.success(`${editingType === 'cliente' ? 'Cliente' : 'Proveedor'} actualizado`);
      } else {
        if (isCli) {
          await clienteService.create({
            nombre: form.nombre,
            telefono: form.telefono,
            email: form.email,
            direccion: form.direccion,
            instagram: form.instagram
          });
        }
        if (isProv) {
          await proveedorService.create({
            nombre: form.nombre,
            rut: form.rut,
            telefono: form.telefono,
            email: form.email,
            direccion: form.direccion,
            contacto: form.contacto
          });
        }
        toast.success(isAmbos ? 'Cliente y Proveedor creados' : `${formType === 'cliente' ? 'Cliente' : 'Proveedor'} creado`);
      }
      setShowModal(false);
      resetForm();
      refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (item) => {
    const type = isCliente ? 'cliente' : 'proveedor';
    setFormType(type);
    setEditingType(type);
    setForm({
      nombre: item.nombre || '',
      telefono: item.telefono || '',
      email: item.email || '',
      direccion: item.direccion || '',
      instagram: item.instagram || '',
      rut: item.rut || '',
      contacto: item.contacto || ''
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const label = isCliente ? 'cliente' : 'proveedor';
    const result = await confirm(`¿Eliminar ${label}?`, 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await service.delete(id);
        toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminado`);
        refreshData();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', telefono: '', email: '', direccion: '', instagram: '', rut: '', contacto: '' });
    setEditingId(null);
    setEditingType('cliente');
    setFormType('cliente');
  };

  const openNewModal = () => {
    resetForm();
    setFormType(isCliente ? 'cliente' : 'proveedor');
    setShowModal(true);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = currentData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(currentData.length / itemsPerPage);

  const exportData = () => {
    const isCli = isCliente;
    const columns = isCli
      ? ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Instagram']
      : ['Nombre', 'RUT', 'Teléfono', 'Email', 'Contacto', 'Dirección'];
    const colKeys = columns.map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentItems.map(item => {
      if (isCli) {
        return { nombre: item.nombre, teléfono: item.telefono, email: item.email, dirección: item.direccion, instagram: item.instagram };
      }
      return { nombre: item.nombre, rut: item.rut, teléfono: item.telefono, email: item.email, contacto: item.contacto, dirección: item.direccion };
    });
    exportToExcel(data, isCli ? 'clientes' : 'proveedores', colKeys);
  };

  const showInstagram = formType === 'cliente' || formType === 'ambos';
  const showRut = formType === 'proveedor' || formType === 'ambos';
  const showContacto = formType === 'proveedor' || formType === 'ambos';

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0">
          <i className="bi bi-people me-2"></i>CRM
        </h2>
        <div className="d-flex flex-wrap gap-2">
          <button className="view-toggle-btn" onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}>
            <i className={`bi bi-${viewMode === 'cards' ? 'table' : 'grid'} me-1`}></i>
            {viewMode === 'cards' ? 'Tabla' : 'Cards'}
          </button>
          <button className="glass-btn" onClick={exportData}><i className="bi bi-file-excel me-1"></i><span className="d-none d-sm-inline">Exportar</span></button>
          <button className="glass-btn glass-btn-primary" onClick={openNewModal}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-tabs mb-4">
        <button
          className={`crm-tab ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('clientes'); setCurrentPage(1); }}
        >
          <i className="bi bi-people-fill me-1"></i>Clientes
        </button>
        <button
          className={`crm-tab ${activeTab === 'proveedores' ? 'active' : ''}`}
          onClick={() => { setActiveTab('proveedores'); setCurrentPage(1); }}
        >
          <i className="bi bi-truck-fill me-1"></i>Proveedores
        </button>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="row g-3 mb-4">
          {currentItems.map(item => (
            <div key={item._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                  <div className="crm-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(item)} title="Editar"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
                  </div>
                </div>
                <p className="crm-card-name">{item.nombre}</p>
                {item.telefono && <div className="crm-card-field"><i className="bi bi-telephone"></i><span>{item.telefono}</span></div>}
                {item.email && <div className="crm-card-field"><i className="bi bi-envelope"></i><span>{item.email}</span></div>}
                {isCliente && item.instagram && <div className="crm-card-field"><i className="bi bi-instagram"></i><span>{item.instagram}</span></div>}
                {!isCliente && item.contacto && <div className="crm-card-field"><i className="bi bi-person"></i><span>Contacto: {item.contacto}</span></div>}
                {item.direccion && <div className="crm-card-field"><i className="bi bi-geo-alt"></i><span>{item.direccion}</span></div>}
              </div>
            </div>
          ))}
          {currentData.length === 0 && (
            <div className="col-12 text-center py-5">
              <i className={`bi bi-${icon}`} style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)' }}></i>
              <p className="text-glass-muted mt-2">No hay {isCliente ? 'clientes' : 'proveedores'} registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-table mb-4">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {isCliente ? (
                    <>
                      <th>Teléfono</th><th>Email</th><th>Instagram</th><th>Dirección</th>
                    </>
                  ) : (
                    <>
                      <th>RUT</th><th>Teléfono</th><th>Email</th><th>Contacto</th><th>Dirección</th>
                    </>
                  )}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item._id}>
                    <td>{item.nombre}</td>
                    {isCliente ? (
                      <>
                        <td>{item.telefono}</td><td>{item.email}</td><td>{item.instagram}</td><td>{item.direccion}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.rut}</td><td>{item.telefono}</td><td>{item.email}</td><td>{item.contacto}</td><td>{item.direccion}</td>
                      </>
                    )}
                    <td>
                      <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(item)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <p className="text-glass-muted small mt-2">Mostrando {currentItems.length} de {currentData.length} {isCliente ? 'clientes' : 'proveedores'}</p>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>{editingId ? 'Editar' : 'Nuevo'} {formType === 'ambos' ? 'Cliente/Proveedor' : formType === 'cliente' ? 'Cliente' : 'Proveedor'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Type Selector */}
                  <div className="crm-type-selector mb-4">
                    <button
                      type="button"
                      className={`crm-type-btn ${formType === 'cliente' ? 'active' : ''}`}
                      onClick={() => setFormType('cliente')}
                    >
                      <i className="bi bi-person-fill me-1"></i>Cliente
                    </button>
                    <button
                      type="button"
                      className={`crm-type-btn ${formType === 'proveedor' ? 'active' : ''}`}
                      onClick={() => setFormType('proveedor')}
                    >
                      <i className="bi bi-truck-fill me-1"></i>Proveedor
                    </button>
                    <button
                      type="button"
                      className={`crm-type-btn ${formType === 'ambos' ? 'active' : ''}`}
                      onClick={() => setFormType('ambos')}
                    >
                      <i className="bi bi-people-fill me-1"></i>Ambos
                    </button>
                  </div>

                  {/* Common fields */}
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input className="glass-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input className="glass-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <input className="glass-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                  </div>

                  {/* Cliente-only */}
                  <div className={`crm-field-transition ${showInstagram ? 'show' : ''}`}>
                    <div className="mb-3">
                      <label className="form-label"><i className="bi bi-instagram me-1"></i>Instagram</label>
                      <input className="glass-input" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
                    </div>
                  </div>

                  {/* Proveedor-only */}
                  <div className={`crm-field-transition ${showRut ? 'show' : ''}`}>
                    <div className="mb-3">
                      <label className="form-label"><i className="bi bi-upc me-1"></i>RUT</label>
                      <input className="glass-input" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} />
                    </div>
                  </div>
                  <div className={`crm-field-transition ${showContacto ? 'show' : ''}`}>
                    <div className="mb-3">
                      <label className="form-label"><i className="bi bi-person-badge me-1"></i>Persona de Contacto</label>
                      <input className="glass-input" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
                    </div>
                  </div>
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

export default CRM;
