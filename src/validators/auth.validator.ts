import { z } from 'zod';
import { Role } from '@/types';

/**
 * Password validation regex
 * At least 8 characters, one uppercase, one lowercase, one number, one special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Name validation regex
 * Only alphabets and spaces allowed
 */
const nameRegex = /^[A-Za-z\s]+$/;

/**
 * Registration schema
 * Validates user registration data
 */
export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .min(1, 'Name is required')
    .regex(nameRegex, 'Name must contain only alphabets and spaces'),

  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email format'),

  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "Role must be either 'author' or 'reader'" }),
  }),
});

/**
 * Login schema
 * Validates user login credentials
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email format'),

  password: z.string({
    required_error: 'Password is required',
  }),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
