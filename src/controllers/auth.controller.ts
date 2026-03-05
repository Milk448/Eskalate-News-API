import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { registerSchema, loginSchema } from '@/validators/auth.validator';
import { sendSuccess } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const user = await authService.register(validatedData);

    // Send response
    return sendSuccess(res, 'User registered successfully', user, 201);
  });

  /**
   * Login user
   * POST /auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(email, password);

    // Send response
    return sendSuccess(res, 'Login successful', result, 200);
  });
}

export default new AuthController();
