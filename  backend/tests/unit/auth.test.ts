import { AppError, Role } from '@/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies BEFORE imports
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { AuthService } from '@/services/auth.service';
import prisma from '@/config/database';

describe('AuthService Edge Cases', () => {
  let authService: AuthService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('Registration Edge Cases', () => {
    /**
     * Test duplicate email returns 409
     * Requirements: 1.5
     */
    it('should return 409 Conflict when email already exists', async () => {
      const existingUser = {
        id: '123',
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser as any);

      const registerData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'Password123!',
        role: Role.reader,
      };

      await expect(authService.register(registerData)).rejects.toThrow(AppError);
      await expect(authService.register(registerData)).rejects.toMatchObject({
        statusCode: 409,
        message: 'User already exists',
        errors: ['Email is already registered'],
      });
    });

    it('should successfully register when email is unique', async () => {
      const newUser = {
        id: '456',
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser as any);

      const registerData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
        role: Role.author,
      };

      const result = await authService.register(registerData);

      expect(result).toEqual({
        id: '456',
        email: 'new@example.com',
        name: 'New User',
        role: Role.author,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('Login Edge Cases', () => {
    /**
     * Test invalid credentials return authentication error
     * Requirements: 2.4
     */
    it('should return 401 when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password')).rejects.toThrow(
        AppError
      );
      await expect(authService.login('nonexistent@example.com', 'password')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect'],
      });
    });

    it('should return 401 when password is incorrect', async () => {
      const user = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.login('user@example.com', 'wrongpassword')).rejects.toThrow(
        AppError
      );
      await expect(authService.login('user@example.com', 'wrongpassword')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect'],
      });
    });

    it('should successfully login with correct credentials', async () => {
      const user = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('mock.jwt.token' as never);

      const result = await authService.login('user@example.com', 'correctpassword');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBe('123');
      expect(result.user.email).toBe('user@example.com');
    });
  });

  describe('Token Validation Edge Cases', () => {
    /**
     * Test expired token handling
     * Requirements: 9.3
     */
    it('should throw 401 for expired token', () => {
      const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      expect(() => authService.validateToken('expired.token')).toThrow(AppError);
      expect(() => authService.validateToken('expired.token')).toThrow(
        expect.objectContaining({
          statusCode: 401,
          message: 'Token expired',
          errors: ['Authentication token has expired'],
        })
      );
    });

    it('should throw 401 for invalid token signature', () => {
      const invalidError = new jwt.JsonWebTokenError('invalid signature');
      mockJwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      expect(() => authService.validateToken('invalid.token')).toThrow(AppError);
      expect(() => authService.validateToken('invalid.token')).toThrow(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid token',
          errors: ['Authentication token is invalid'],
        })
      );
    });

    it('should throw 401 for malformed token payload', () => {
      // Token without required claims
      mockJwt.verify.mockReturnValue({ iat: 123456 } as never);

      expect(() => authService.validateToken('malformed.token')).toThrow(AppError);
      expect(() => authService.validateToken('malformed.token')).toThrow(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid token',
          errors: ['Token payload is malformed'],
        })
      );
    });

    it('should successfully validate valid token', () => {
      const validPayload = {
        sub: '123',
        role: Role.author,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      mockJwt.verify.mockReturnValue(validPayload as never);

      const result = authService.validateToken('valid.token');

      expect(result).toEqual({
        sub: '123',
        role: Role.author,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with correct salt rounds', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: Role.author,
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    });
  });

  describe('Token Generation', () => {
    it('should generate token with correct payload and expiration', () => {
      mockJwt.sign.mockReturnValue('mock.jwt.token' as never);

      const token = authService.generateToken('user-123', Role.author);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'user-123', role: Role.author },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(token).toBe('mock.jwt.token');
    });
  });
});
