import { z } from 'zod';

export const movimientoStockSchema = z.object({
  id_producto: z.string().min(1, 'Selecciona un producto'),
  tipo: z.enum(['ingreso', 'egreso', 'ajuste', 'reserva', 'devolucion']),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  deposito: z.string().min(1, 'El deposito es obligatorio'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
  id_comprobante: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional(),
});
