import { z } from 'zod';

export const usuarioSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio').min(3, 'Minimo 3 caracteres'),
  password: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rol: z.enum(['admin', 'vendedor']),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
