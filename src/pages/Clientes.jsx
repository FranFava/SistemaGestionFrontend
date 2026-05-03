import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteService } from '../services/api';
import { clienteSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';
import { FormInput, FormModal } from '../components/form';
import { PageHeader, EmptyState, LoadingOverlay } from '../components/ui';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: '', rut: '', telefono: '', email: '', direccion: '' },
  });

  const fetchClientes = async () => {
    try {
      const res = await clienteService.getAll();
      const data = res.data?.data || res.data || [];
      setClientes(data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await clienteService.update(editingId, data);
        toast.success('Cliente actualizado');
      } else {
        await clienteService.create(data);
        toast.success('Cliente creado');
      }
      setShowModal(false);
      reset();
      setEditingId(null);
      fetchClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (c) => {
    setValue('nombre', c.nombre);
    setValue('rut', c.rut || '');
    setValue('telefono', c.telefono || '');
    setValue('email', c.email || '');
    setValue('direccion', c.direccion || '');
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('Eliminar cliente', 'Esta accion no se puede deshacer');
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

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentClientes = clientes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(clientes.length / itemsPerPage);

  const exportData = () => {
    const columns = ['Nombre', 'RUT', 'Telefono', 'Email', 'Direccion'].map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentClientes.map(c => ({
      nombre: c.nombre, rut: c.rut, telefono: c.telefono, email: c.email, direccion: c.direccion
    }));
    exportToExcel(data, 'clientes', columns);
  };

  if (loading) return <LoadingOverlay text="Cargando clientes..." />;

  return (
    <div>
      <PageHeader
        icon="people"
        title="Clientes"
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
          <thead><tr><th>Nombre</th><th>RUT</th><th>Telefono</th><th>Email</th><th>Direccion</th><th>Acciones</th></tr></thead>
          <tbody>
            {currentClientes.length === 0 ? (
              <tr><td colSpan="6"><EmptyState icon="people" title="No hay clientes registrados" description="Crea tu primer cliente con el boton Nuevo" /></td></tr>
            ) : currentClientes.map(c => (
              <tr key={c._id}>
                <td>{c.nombre}</td>
                <td>{c.rut || '—'}</td>
                <td>{c.telefono || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.direccion || '—'}</td>
                <td>
                  <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(c)} title="Editar" style={{ padding: '4px 8px' }}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} title="Eliminar" style={{ padding: '4px 8px' }}><i className="bi bi-trash"></i></button>
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
        title={editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
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
      </FormModal>
    </div>
  );
};

export default Clientes;
