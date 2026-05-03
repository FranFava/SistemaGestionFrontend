import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proveedorService } from '../services/api';
import { proveedorSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';
import { FormInput, FormModal } from '../components/form';
import { PageHeader, EmptyState, LoadingOverlay } from '../components/ui';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(proveedorSchema),
    defaultValues: { nombre: '', rut: '', telefono: '', email: '', direccion: '', contacto: '' },
  });

  const fetchProveedores = async () => {
    try {
      const res = await proveedorService.getAll();
      const data = res.data?.data || res.data || [];
      setProveedores(data);
    } catch {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await proveedorService.update(editingId, data);
        toast.success('Proveedor actualizado');
      } else {
        await proveedorService.create(data);
        toast.success('Proveedor creado');
      }
      setShowModal(false);
      reset();
      setEditingId(null);
      fetchProveedores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setValue('nombre', p.nombre);
    setValue('rut', p.rut || '');
    setValue('telefono', p.telefono || '');
    setValue('email', p.email || '');
    setValue('direccion', p.direccion || '');
    setValue('contacto', p.contacto || '');
    setEditingId(p._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('Eliminar proveedor', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await proveedorService.delete(id);
        toast.success('Proveedor eliminado');
        fetchProveedores();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProveedores = proveedores.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(proveedores.length / itemsPerPage);

  const exportData = () => {
    const columns = ['Nombre', 'RUT', 'Telefono', 'Email', 'Direccion', 'Contacto'].map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentProveedores.map(p => ({
      nombre: p.nombre, rut: p.rut, telefono: p.telefono, email: p.email, direccion: p.direccion, contacto: p.contacto
    }));
    exportToExcel(data, 'proveedores', columns);
  };

  if (loading) return <LoadingOverlay text="Cargando proveedores..." />;

  return (
    <div>
      <PageHeader
        icon="truck"
        title="Proveedores"
        actions={
          <>
            <button className="glass-btn" onClick={exportData}><i className="bi bi-file-excel me-1"></i>Exportar</button>
            <button className="glass-btn glass-btn-primary" onClick={() => { reset(); setEditingId(null); setShowModal(true); }}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
          </>
        }
      />

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead><tr><th>Nombre</th><th>RUT</th><th>Telefono</th><th>Email</th><th>Contacto</th><th>Acciones</th></tr></thead>
          <tbody>
            {currentProveedores.length === 0 ? (
              <tr><td colSpan="6"><EmptyState icon="truck" title="No hay proveedores registrados" description="Crea tu primer proveedor con el boton Nuevo" /></td></tr>
            ) : currentProveedores.map(p => (
              <tr key={p._id}>
                <td>{p.nombre}</td>
                <td>{p.rut || '—'}</td>
                <td>{p.telefono || '—'}</td>
                <td>{p.email || '—'}</td>
                <td>{p.contacto || '—'}</td>
                <td>
                  <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(p)} title="Editar" style={{ padding: '4px 8px' }}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)} title="Eliminar" style={{ padding: '4px 8px' }}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      <FormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); reset(); setEditingId(null); }}
        title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        onSubmit={handleSubmit(onSubmit)}
        isEditing={!!editingId}
        isLoading={isSubmitting}
      >
        <Controller name="nombre" control={control} render={({ field }) => (
          <FormInput label="Nombre" {...field} error={errors.nombre?.message} required icon="person" />
        )} />
        <Controller name="rut" control={control} render={({ field }) => (
          <FormInput label="RUT" {...field} error={errors.rut?.message} icon="upc-scan" />
        )} />
        <Controller name="telefono" control={control} render={({ field }) => (
          <FormInput label="Telefono" type="tel" {...field} error={errors.telefono?.message} icon="telephone" />
        )} />
        <Controller name="email" control={control} render={({ field }) => (
          <FormInput label="Email" type="email" {...field} error={errors.email?.message} icon="envelope" />
        )} />
        <Controller name="direccion" control={control} render={({ field }) => (
          <FormInput label="Direccion" {...field} error={errors.direccion?.message} icon="geo-alt" />
        )} />
        <Controller name="contacto" control={control} render={({ field }) => (
          <FormInput label="Persona de Contacto" {...field} error={errors.contacto?.message} icon="person-badge" />
        )} />
      </FormModal>
    </div>
  );
};

export default Proveedores;
