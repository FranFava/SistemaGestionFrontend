import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  direccion: z.string().optional(),
});

export const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
});
