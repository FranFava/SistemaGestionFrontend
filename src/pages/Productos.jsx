import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productoService } from '../services/api';
import { productoSchema } from '../schemas';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import ProductoDetalle from '../components/ProductoDetalle';
import { exportProductosExcel } from '../utils/exportUtils';
import { FormInput, FormNumber, FormTextarea, FormModal } from '../components/form';
import { PageHeader, StatusBadge, EmptyState, LoadingOverlay } from '../components/ui';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuChecking, setSkuChecking] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: { nombre: '', sku: '', marca: '', categoria: '', descripcion: '', precioCosto: '', precioVenta: '', stockMinimo: '', garantiaMeses: '', variantes: [] },
  });

  const { fields: variantes, append, remove } = useFieldArray({ control, name: 'variantes' });

  const skuValue = watch('sku');

  const fetchProductos = async () => {
    try {
      const res = await productoService.getAll();
      setProductos(res.data?.data || res.data || []);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    if (!skuValue || editingId) return;
    const timeout = setTimeout(async () => {
      setSkuChecking(true);
      try {
        const { data } = await productoService.checkSku(skuValue);
        if (data.exists) {
          toast.warning('Este SKU ya esta en uso');
        }
      } catch { /* ignore */ }
      setSkuChecking(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [skuValue, editingId]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (editingId) {
        await productoService.update(editingId, payload);
        toast.success('Producto actualizado');
      } else {
        await productoService.create(payload);
        toast.success('Producto creado');
      }
      setShowModal(false);
      reset();
      setEditingId(null);
      fetchProductos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setValue('nombre', p.nombre);
    setValue('sku', p.sku);
    setValue('marca', p.marca || '');
    setValue('categoria', p.categoria || '');
    setValue('descripcion', p.descripcion || '');
    setValue('precioCosto', p.precioCosto || '');
    setValue('precioVenta', p.precioVenta);
    setValue('stockMinimo', p.stockMinimo || '');
    setValue('garantiaMeses', p.garantiaMeses || '');
    setValue('variantes', p.variantes || []);
    setEditingId(p._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('Eliminar producto', 'Esta accion no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await productoService.delete(id);
        toast.success('Producto eliminado');
        fetchProductos();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleVerDetalle = (p) => {
    setSelectedProducto(p);
    setShowDetalle(true);
  };

  const getTotalStock = (p) => p.variantes.reduce((sum, v) => sum + (v.stock || 0), 0);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProductos = productos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(productos.length / itemsPerPage);

  if (loading) return <LoadingOverlay text="Cargando productos..." />;

  return (
    <div>
      <PageHeader
        icon="box"
        title="Productos"
        actions={
          <>
            <button className="glass-btn" onClick={() => exportProductosExcel(productos)}>
              <i className="bi bi-file-excel me-1"></i><span className="d-none d-sm-inline">Exportar Excel</span>
            </button>
            <button className="glass-btn glass-btn-primary" onClick={() => { reset(); setEditingId(null); setShowModal(true); }}>
              <i className="bi bi-plus-circle me-1"></i><span className="d-none d-sm-inline">Nuevo</span>
            </button>
          </>
        }
      />

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead>
            <tr>
              <th>SKU</th><th>Nombre</th><th>Marca</th><th>Stock Total</th><th>Stock Minimo</th><th>Precio Venta</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentProductos.length === 0 ? (
              <tr><td colSpan="7"><EmptyState icon="box" title="No hay productos registrados" description="Crea tu primer producto con el boton Nuevo" /></td></tr>
            ) : currentProductos.map(p => (
              <tr key={p._id}>
                <td>{p.sku}</td>
                <td>{p.nombre}</td>
                <td>{p.marca || '—'}</td>
                <td className={getTotalStock(p) <= (p.stockMinimo || 0) ? 'text-danger fw-bold' : ''}>{getTotalStock(p)}</td>
                <td>{p.stockMinimo || 0}</td>
                <td>${p.precioVenta}</td>
                <td>
                  <button className="btn btn-secondary btn-sm me-1" onClick={() => handleVerDetalle(p)} title="Ver detalle" style={{ padding: '4px 8px' }}><i className="bi bi-eye"></i></button>
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
        title={editingId ? 'Editar Producto' : 'Nuevo Producto'}
        onSubmit={handleSubmit(onSubmit)}
        isEditing={!!editingId}
        isLoading={isSubmitting}
        size="lg"
      >
        <div className="row g-3">
          <div className="col-md-6">
            <Controller name="nombre" control={control} render={({ field }) => (
              <FormInput label="Nombre" {...field} error={errors.nombre?.message} required />
            )} />
          </div>
          <div className="col-md-6">
            <Controller name="sku" control={control} render={({ field }) => (
              <FormInput label="SKU" {...field} error={errors.sku?.message} required disabled={!!editingId} />
            )} />
            {skuChecking && <div className="text-muted small"><i className="bi bi-hourglass-split me-1"></i>Verificando...</div>}
          </div>
          <div className="col-md-6">
            <Controller name="marca" control={control} render={({ field }) => (
              <FormInput label="Marca" {...field} />
            )} />
          </div>
          <div className="col-md-6">
            <Controller name="categoria" control={control} render={({ field }) => (
              <FormInput label="Categoria" {...field} />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="precioCosto" control={control} render={({ field }) => (
              <FormNumber label="Precio Costo" {...field} prefix="$" />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="precioVenta" control={control} render={({ field }) => (
              <FormNumber label="Precio Venta" {...field} error={errors.precioVenta?.message} prefix="$" required />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="stockMinimo" control={control} render={({ field }) => (
              <FormNumber label="Stock Minimo" {...field} step="1" />
            )} />
          </div>
          <div className="col-md-4">
            <Controller name="garantiaMeses" control={control} render={({ field }) => (
              <FormNumber label="Garantia (meses)" {...field} step="1" />
            )} />
          </div>
          <div className="col-12">
            <Controller name="descripcion" control={control} render={({ field }) => (
              <FormTextarea label="Descripcion" {...field} rows={2} />
            )} />
          </div>
        </div>

        <hr />
        <h6>Variantes</h6>
        <div className="row g-2 mb-2 align-items-end">
          <div className="col-md-4">
            <input className="form-control glass-input" placeholder="Color" id="var-color" />
          </div>
          <div className="col-md-3">
            <input className="form-control glass-input" placeholder="Capacidad" id="var-cap" />
          </div>
          <div className="col-md-3">
            <input type="number" className="form-control glass-input" placeholder="Stock" id="var-stock" />
          </div>
          <div className="col-md-2">
            <button type="button" className="btn btn-outline-primary w-100 btn-sm" onClick={() => {
              const color = document.getElementById('var-color').value;
              const cap = document.getElementById('var-cap').value;
              const stock = document.getElementById('var-stock').value;
              if (color || cap) {
                append({ color, capacidad: cap, stock: Number(stock) || 0 });
                document.getElementById('var-color').value = '';
                document.getElementById('var-cap').value = '';
                document.getElementById('var-stock').value = '';
              }
            }}>Agregar</button>
          </div>
        </div>
        {variantes.length > 0 && (
          <table className="table table-sm">
            <thead><tr><th>Color</th><th>Capacidad</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {variantes.map((v, i) => (
                <tr key={v.id}>
                  <td>{v.color || '—'}</td>
                  <td>{v.capacidad || '—'}</td>
                  <td>{v.stock}</td>
                  <td><button type="button" className="btn btn-sm btn-danger" onClick={() => remove(i)}>x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FormModal>

      {showDetalle && selectedProducto && (
        <ProductoDetalle producto={selectedProducto} onClose={() => { setShowDetalle(false); setSelectedProducto(null); }} />
      )}
    </div>
  );
};

export default Productos;
