import { useState, useEffect, useCallback } from 'react';
import { categoriaService } from '../services/api';
import { toast, confirm } from '../components/Swal';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', id_padre: '', descripcion: '' });
  const [viewMode, setViewMode] = useState('tree');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await categoriaService.getAll();
      setCategorias(data);
    } catch {
      toast.error('Error al cargar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, id_padre: form.id_padre || null };
      if (editingId) {
        await categoriaService.update(editingId, payload);
        toast.success('Categoria actualizada');
      } else {
        await categoriaService.create(payload);
        toast.success('Categoria creada');
      }
      setShowModal(false);
      resetForm();
      fetchCategorias();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (cat) => {
    setForm({
      nombre: cat.nombre,
      id_padre: cat.id_padre?._id || '',
      descripcion: cat.descripcion || ''
    });
    setEditingId(cat._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('Eliminar categoria', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await categoriaService.delete(id);
        toast.success('Categoria eliminada');
        fetchCategorias();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', id_padre: '', descripcion: '' });
    setEditingId(null);
  };

  const buildTree = useCallback(() => {
    const map = {};
    const roots = [];
    categorias.forEach(c => {
      map[c._id] = { ...c, hijos: [] };
    });
    categorias.forEach(c => {
      if (c.id_padre && map[c.id_padre._id || c.id_padre]) {
        map[c.id_padre._id || c.id_padre].hijos.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    return roots;
  }, [categorias]);

  const renderTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node._id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="glass-card p-3 mb-2 d-flex align-items-center justify-content-between">
          <div>
            <i className={`bi bi-${node.hijos?.length ? 'folder2' : 'folder'} me-2 text-info`}></i>
            <strong>{node.nombre}</strong>
            {node.descripcion && <small className="text-muted ms-2">— {node.descripcion}</small>}
          </div>
          <div>
            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(node)}>
              <i className="bi bi-pencil"></i>
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(node._id)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
        {node.hijos?.length > 0 && renderTree(node.hijos, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  const tree = buildTree();

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-diagram-3 me-2"></i>Categorias</h4>
          <p className="text-muted mb-0">Gestiona el arbol de rubros de productos</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('tree')}>
              <i className="bi bi-diagram-3 me-1"></i>Arbol
            </button>
            <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('table')}>
              <i className="bi bi-table me-1"></i>Tabla
            </button>
          </div>
          <button className="glass-btn glass-btn-primary btn" onClick={() => { resetForm(); setShowModal(true); }}>
            <i className="bi bi-plus-lg me-1"></i>Nueva
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div className="glass-card p-4">
          {tree.length === 0 && <p className="text-muted text-center">No hay categorias creadas</p>}
          {renderTree(tree)}
        </div>
      ) : (
        <div className="glass-table">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoria Padre</th>
                  <th>Descripcion</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <tr key={cat._id}>
                    <td><strong>{cat.nombre}</strong></td>
                    <td>{cat.id_padre?.nombre || <span className="text-muted">—</span>}</td>
                    <td>{cat.descripcion || '—'}</td>
                    <td>
                      <span className={`badge bg-${cat.activa ? 'success' : 'secondary'}`}>
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(cat)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-diagram-3 me-2"></i>
                  {editingId ? 'Editar Categoria' : 'Nueva Categoria'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Categoria Padre</label>
                    <select
                      className="form-select glass-input"
                      value={form.id_padre}
                      onChange={e => setForm({ ...form, id_padre: e.target.value })}
                    >
                      <option value="">Sin padre (raiz)</option>
                      {categorias
                        .filter(c => c._id !== editingId)
                        .map(c => (
                          <option key={c._id} value={c._id}>{c.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      className="form-control glass-input"
                      value={form.descripcion}
                      onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;
