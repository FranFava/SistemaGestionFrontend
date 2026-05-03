import { z } from 'zod';

export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  id_padre: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional(),
});

export const listaPrecioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  moneda: z.enum(['ARS', 'USD']).default('ARS'),
  descripcion: z.string().optional(),
});

export const precioProductoSchema = z.object({
  id_producto: z.string().min(1, 'Selecciona un producto'),
  id_lista: z.string().min(1, 'Selecciona una lista'),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  moneda: z.enum(['ARS', 'USD']).default('ARS'),
  vigencia_desde: z.string().min(1, 'La fecha de vigencia es obligatoria'),
  vigencia_hasta: z.string().optional().or(z.literal('')),
});
