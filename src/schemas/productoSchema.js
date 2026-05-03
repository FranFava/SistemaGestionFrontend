import { z } from 'zod';

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio').regex(/^[A-Z0-9-]+$/, 'SKU solo permite mayusculas, numeros y guiones'),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  descripcion: z.string().optional(),
  precioCosto: z.coerce.number().min(0, 'El precio costo no puede ser negativo').default(0),
  precioVenta: z.coerce.number().min(0, 'El precio venta no puede ser negativo'),
  stockMinimo: z.coerce.number().min(0, 'El stock minimo no puede ser negativo').default(0),
  garantiaMeses: z.coerce.number().min(0).default(0),
  variantes: z.array(z.object({
    color: z.string().optional(),
    capacidad: z.string().optional(),
    stock: z.coerce.number().default(0),
  })).default([]),
});
