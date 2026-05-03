import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usuarioService } from '../services/api';
import { usuarioSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { FormInput, FormSelect, FormModal } from '../components/form';
import { PageHeader, StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { username: '', password: '', nombre: '', rol: 'vendedor' },
  });

  const fetchUsuarios = async () => {
    try {
      const res = await usuarioService.getAll();
      setUsuarios(res.data?.data || res.data || []);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { password, ...rest } = data;
        await usuarioService.update(editingId, password ? data : rest);
        toast.success('Usuario actualizado');
      } else {
        await usuarioService.create(data);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      reset();
      setEditingId(null);
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (u) => {
    setValue('username', u.username);
    setValue('password', '');
    setValue('nombre', u.nombre);
    setValue('rol', u.rol);
    setEditingId(u._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('Eliminar usuario', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await usuarioService.delete(id);
        toast.success('Usuario eliminado');
        fetchUsuarios();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsuarios = usuarios.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);

  if (loading) return <LoadingOverlay text="Cargando usuarios..." />;

  const rolOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
  ];

  return (
    <div>
      <PageHeader
        icon="people"
        title="Usuarios"
        actions={
          <button className="glass-btn glass-btn-primary" onClick={() => { reset(); setEditingId(null); setShowModal(true); }}>
            <i className="bi bi-plus-circle me-1"></i>Nuevo
          </button>
        }
      />

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsuarios.length === 0 ? (
              <tr><td colSpan="5"><EmptyState icon="people" title="No hay usuarios registrados" /></td></tr>
            ) : currentUsuarios.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.nombre}</td>
                <td><StatusBadge value={u.rol} /></td>
                <td><StatusBadge value={u.activo ? 'Activo' : 'Inactivo'} /></td>
                <td>
                  <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(u)} title="Editar" style={{ padding: '4px 8px' }}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)} title="Eliminar" style={{ padding: '4px 8px' }}><i className="bi bi-trash"></i></button>
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
        title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
        onSubmit={handleSubmit(onSubmit)}
        isEditing={!!editingId}
        isLoading={isSubmitting}
      >
        <Controller name="username" control={control} render={({ field }) => (
          <FormInput label="Usuario" {...field} error={errors.username?.message} required icon="person" disabled={!!editingId} />
        )} />
        <Controller name="password" control={control} render={({ field }) => (
          <FormInput label={editingId ? 'Nueva Contraseña' : 'Contraseña'} type="password" {...field} error={errors.password?.message} required={!editingId} icon="lock" />
        )} />
        <Controller name="nombre" control={control} render={({ field }) => (
          <FormInput label="Nombre" {...field} error={errors.nombre?.message} required icon="person-badge" />
        )} />
        <Controller name="rol" control={control} render={({ field }) => (
          <FormSelect label="Rol" options={rolOptions} {...field} error={errors.rol?.message} required />
        )} />
      </FormModal>
    </div>
  );
};

export default Usuarios;
