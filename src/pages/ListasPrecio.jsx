import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listaPrecioService, precioProductoService, productoService } from '../services/api';
import { listaPrecioSchema, precioProductoSchema } from '../schemas';
import { toast } from '../components/Swal';
import { FormInput, FormSelect, FormNumber, FormDate, FormModal } from '../components/form';
import { StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const ListasPrecio = () => {
  const [listas, setListas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showListaModal, setShowListaModal] = useState(false);
  const [showPrecioModal, setShowPrecioModal] = useState(false);
  const [editingListaId, setEditingListaId] = useState(null);
  const [editingPrecioId, setEditingPrecioId] = useState(null);
  const [selectedLista, setSelectedLista] = useState(null);
  const [isSubmittingLista, setIsSubmittingLista] = useState(false);
  const [isSubmittingPrecio, setIsSubmittingPrecio] = useState(false);

  const listaForm = useForm({
    resolver: zodResolver(listaPrecioSchema),
    defaultValues: { nombre: '', moneda: 'ARS', descripcion: '' },
  });

  const precioForm = useForm({
    resolver: zodResolver(precioProductoSchema),
    defaultValues: {
      id_producto: '', id_lista: '', precio: '', moneda: 'ARS',
      vigencia_desde: new Date().toISOString().split('T')[0], vigencia_hasta: '',
    },
  });

  useEffect(() => {
    fetchListas();
    fetchProductos();
  }, []);

  useEffect(() => {
    if (selectedLista) fetchPrecios(selectedLista);
  }, [selectedLista]);

  const fetchListas = async () => {
    try {
      const res = await listaPrecioService.getAll();
      const arr = res.data?.data || res.data || [];
      setListas(arr);
      if (arr.length && !selectedLista) setSelectedLista(arr[0]._id);
    } catch {
      toast.error('Error al cargar listas de precios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrecios = async (listaId) => {
    try {
      const res = await precioProductoService.getByLista(listaId);
      setPrecios(res.data?.data || res.data || []);
    } catch {
      toast.error('Error al cargar precios');
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await productoService.getAll();
      setProductos(res.data?.data || res.data || []);
    } catch {
      toast.error('Error al cargar productos');
    }
  };

  const onListaSubmit = async (data) => {
    setIsSubmittingLista(true);
    try {
      if (editingListaId) {
        await listaPrecioService.update(editingListaId, data);
        toast.success('Lista actualizada');
      } else {
        await listaPrecioService.create(data);
        toast.success('Lista creada');
      }
      setShowListaModal(false);
      listaForm.reset();
      setEditingListaId(null);
      fetchListas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmittingLista(false);
    }
  };

  const onPrecioSubmit = async (data) => {
    setIsSubmittingPrecio(true);
    try {
      const payload = { ...data, vigencia_hasta: data.vigencia_hasta || null };
      if (editingPrecioId) {
        await precioProductoService.update(editingPrecioId, payload);
        toast.success('Precio actualizado');
      } else {
        await precioProductoService.create(payload);
        toast.success('Precio creado');
      }
      setShowPrecioModal(false);
      precioForm.reset();
      setEditingPrecioId(null);
      fetchPrecios(selectedLista);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmittingPrecio(false);
    }
  };

  const handleEditPrecio = (precio) => {
    precioForm.setValue('id_producto', precio.id_producto?._id || precio.id_producto);
    precioForm.setValue('id_lista', precio.id_lista?._id || precio.id_lista);
    precioForm.setValue('precio', precio.precio?.$numberDecimal || precio.precio);
    precioForm.setValue('moneda', precio.moneda);
    precioForm.setValue('vigencia_desde', new Date(precio.vigencia_desde).toISOString().split('T')[0]);
    precioForm.setValue('vigencia_hasta', precio.vigencia_hasta ? new Date(precio.vigencia_hasta).toISOString().split('T')[0] : '');
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

  const formatPrecio = (precio) => {
    const num = precio?.$numberDecimal || precio;
    return num ? Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—';
  };

  const formatDate = (date) => {
    if (!date) return 'Sin limite';
    return new Date(date).toLocaleDateString('es-AR');
  };

  if (loading) return <LoadingOverlay text="Cargando listas de precios..." />;

  const monedaOptions = [{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }];
  const productoOptions = productos.filter(p => p.activo).map(p => ({ value: p._id, label: `${p.nombre} (${p.sku})` }));

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-tags me-2"></i>Listas de Precios</h4>
          <p className="text-muted mb-0">Gestiona listas de precios con vigencia por producto</p>
        </div>
        <button className="glass-btn glass-btn-primary btn" onClick={() => { listaForm.reset(); setEditingListaId(null); setShowListaModal(true); }}>
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
              precioForm.reset();
              precioForm.setValue('vigencia_desde', new Date().toISOString().split('T')[0]);
              setEditingPrecioId(null);
              setShowPrecioModal(true);
            }}>
              <i className="bi bi-plus-lg me-1"></i>Agregar Precio
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>Producto</th><th>SKU</th><th>Precio</th><th>Vigencia Desde</th><th>Vigencia Hasta</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {precios.length === 0 ? (
                  <tr><td colSpan="6"><EmptyState icon="tag" title="Sin precios en esta lista" /></td></tr>
                ) : precios.map(p => (
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista Modal */}
      <FormModal
        isOpen={showListaModal}
        onClose={() => { setShowListaModal(false); listaForm.reset(); setEditingListaId(null); }}
        title={editingListaId ? 'Editar Lista' : 'Nueva Lista de Precios'}
        onSubmit={listaForm.handleSubmit(onListaSubmit)}
        isEditing={!!editingListaId}
        isLoading={isSubmittingLista}
        size="md"
      >
        <Controller name="nombre" control={listaForm.control} render={({ field }) => (
          <FormInput label="Nombre" {...field} error={listaForm.formState.errors.nombre?.message} required icon="tag" />
        )} />
        <Controller name="moneda" control={listaForm.control} render={({ field }) => (
          <FormSelect label="Moneda" options={monedaOptions} {...field} error={listaForm.formState.errors.moneda?.message} required />
        )} />
        <Controller name="descripcion" control={listaForm.control} render={({ field }) => (
          <FormTextarea label="Descripcion" {...field} rows={2} />
        )} />
      </FormModal>

      {/* Precio Modal */}
      <FormModal
        isOpen={showPrecioModal}
        onClose={() => { setShowPrecioModal(false); precioForm.reset(); setEditingPrecioId(null); }}
        title={editingPrecioId ? 'Editar Precio' : 'Nuevo Precio'}
        onSubmit={precioForm.handleSubmit(onPrecioSubmit)}
        isEditing={!!editingPrecioId}
        isLoading={isSubmittingPrecio}
      >
        <Controller name="id_producto" control={precioForm.control} render={({ field }) => (
          <FormSelect label="Producto" options={productoOptions} {...field} error={precioForm.formState.errors.id_producto?.message} required />
        )} />
        <div className="row">
          <div className="col-6">
            <Controller name="precio" control={precioForm.control} render={({ field }) => (
              <FormNumber label="Precio" {...field} error={precioForm.formState.errors.precio?.message} prefix="$" required />
            )} />
          </div>
          <div className="col-6">
            <Controller name="moneda" control={precioForm.control} render={({ field }) => (
              <FormSelect label="Moneda" options={monedaOptions} {...field} />
            )} />
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <Controller name="vigencia_desde" control={precioForm.control} render={({ field }) => (
              <FormDate label="Vigencia Desde" {...field} error={precioForm.formState.errors.vigencia_desde?.message} required />
            )} />
          </div>
          <div className="col-6">
            <Controller name="vigencia_hasta" control={precioForm.control} render={({ field }) => (
              <FormDate label="Vigencia Hasta" {...field} />
            )} />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ListasPrecio;
