import { z } from 'zod';

export const comprobanteItemSchema = z.object({
  id_producto: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  descuento_pct: z.coerce.number().min(0).max(100).default(0),
  moneda: z.enum(['ARS', 'USD']).default('ARS'),
});

export const comprobanteSchema = z.object({
  id_cuenta: z.string().min(1, 'Selecciona una cuenta'),
  tipo: z.enum(['FACT', 'REC', 'NC', 'ND', 'SENIA', 'REM']),
  origen: z.enum(['compra', 'venta']),
  moneda: z.enum(['ARS', 'USD']).default('ARS'),
  nro_comprobante: z.string().optional(),
  fecha_vencimiento: z.string().optional().or(z.literal('')),
  cotizacion_usado: z.coerce.number().optional(),
  observaciones: z.string().optional(),
  id_remito_origen: z.string().optional().or(z.literal('')),
  items: z.array(comprobanteItemSchema).min(1, 'Agrega al menos un item'),
}).refine((data) => {
  if (data.moneda === 'USD' && (!data.cotizacion_usado || data.cotizacion_usado <= 0)) {
    return { message: 'La cotizacion USD es obligatoria', path: ['cotizacion_usado'] };
  }
  return true;
});

export const pagoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
});
