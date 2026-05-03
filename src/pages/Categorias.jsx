import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoriaService } from '../services/api';
import { categoriaSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import { FormInput, FormSelect, FormTextarea, FormModal } from '../components/form';
import { PageHeader, StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('tree');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: '', id_padre: '', descripcion: '' },
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await categoriaService.getAll();
      setCategorias(res.data?.data || res.data || []);
    } catch {
      toast.error('Error al cargar categorias');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, id_padre: data.id_padre || null };
      if (editingId) {
        await categoriaService.update(editingId, payload);
        toast.success('Categoria actualizada');
      } else {
        await categoriaService.create(payload);
        toast.success('Categoria creada');
      }
      setShowModal(false);
      reset();
      setEditingId(null);
      fetchCategorias();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setValue('nombre', cat.nombre);
    setValue('id_padre', cat.id_padre?._id || '');
    setValue('descripcion', cat.descripcion || '');
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

  const buildTree = useCallback(() => {
    const map = {};
    const roots = [];
    categorias.forEach(c => { map[c._id] = { ...c, hijos: [] }; });
    categorias.forEach(c => {
      if (c.id_padre && map[c.id_padre._id || c.id_padre]) {
        map[c.id_padre._id || c.id_padre].hijos.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    return roots;
  }, [categorias]);

  const renderTree = (nodes, level = 0) => nodes.map(node => (
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

  if (loading) return <LoadingOverlay text="Cargando categorias..." />;

  const tree = buildTree();
  const parentOptions = categorias
    .filter(c => c._id !== editingId)
    .map(c => ({ value: c._id, label: c.nombre }));

  return (
    <div className="container-fluid py-4">
      <PageHeader
        icon="diagram-3"
        title="Categorias"
        subtitle="Gestiona el arbol de rubros de productos"
        actions={
          <>
            <div className="btn-group">
              <button className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('tree')}>
                <i className="bi bi-diagram-3 me-1"></i>Arbol
              </button>
              <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('table')}>
                <i className="bi bi-table me-1"></i>Tabla
              </button>
            </div>
            <button className="glass-btn glass-btn-primary btn" onClick={() => { reset(); setEditingId(null); setShowModal(true); }}>
              <i className="bi bi-plus-lg me-1"></i>Nueva
            </button>
          </>
        }
      />

      {viewMode === 'tree' ? (
        <div className="glass-card p-4">
          {tree.length === 0 ? <EmptyState icon="diagram-3" title="No hay categorias creadas" /> : renderTree(tree)}
        </div>
      ) : (
        <div className="glass-table">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>Nombre</th><th>Categoria Padre</th><th>Descripcion</th><th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <tr key={cat._id}>
                    <td><strong>{cat.nombre}</strong></td>
                    <td>{cat.id_padre?.nombre || <span className="text-muted">—</span>}</td>
                    <td>{cat.descripcion || '—'}</td>
                    <td><StatusBadge value={cat.activa ? 'Activa' : 'Inactiva'} /></td>
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
                {categorias.length === 0 && (
                  <tr><td colSpan="5"><EmptyState icon="diagram-3" title="No hay categorias" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); reset(); setEditingId(null); }}
        title={editingId ? 'Editar Categoria' : 'Nueva Categoria'}
        onSubmit={handleSubmit(onSubmit)}
        isEditing={!!editingId}
        isLoading={isSubmitting}
        size="md"
      >
        <Controller name="nombre" control={control} render={({ field }) => (
          <FormInput label="Nombre" {...field} error={errors.nombre?.message} required icon="tag" />
        )} />
        <Controller name="id_padre" control={control} render={({ field }) => (
          <FormSelect label="Categoria Padre" options={parentOptions} placeholder="Sin padre (raiz)" {...field} error={errors.id_padre?.message} />
        )} />
        <Controller name="descripcion" control={control} render={({ field }) => (
          <FormTextarea label="Descripcion" {...field} rows={3} />
        )} />
      </FormModal>
    </div>
  );
};

export default Categorias;
