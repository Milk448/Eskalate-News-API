import request from 'supertest';
import { createApp } from '@/app';
import { Application } from 'express';
import { Role } from '@/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $use: jest.fn(),
  },
}));

import prisma from '@/config/database';

describe('Auth HTTP Endpoints', () => {
  let app: Application;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register - User Registration', () => {
    it('should register user with valid data', async () => {
      const newUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'author',
        })
        .expect(201);

      expect(response.body.Success).toBe(true);
      expect(response.body.Message).toContain('registered');
      expect(response.body.Object.email).toBe('john@example.com');
      expect(response.body.Object).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'Password123!',
          role: 'author',
        })
        .expect(409);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('already exists');
      expect(response.body.Errors).toContain('Email is already registered');
    });

    it('should return 400 for invalid name (contains numbers)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John123',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Validation failed');
      expect(response.body.Errors.some((e: string) => e.includes('alphabets'))).toBe(true);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'Password123!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('email'))).toBe(true);
    });

    it('should return 400 for weak password (no uppercase)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('uppercase'))).toBe(true);
    });

    it('should return 400 for weak password (no lowercase)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'PASSWORD123!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('lowercase'))).toBe(true);
    });

    it('should return 400 for weak password (no number)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('number'))).toBe(true);
    });

    it('should return 400 for weak password (no special character)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('special'))).toBe(true);
    });

    it('should return 400 for short password (less than 8 characters)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Pass1!',
          role: 'author',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('8 characters'))).toBe(true);
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'admin',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('author') || e.includes('reader'))).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
    });
  });

  describe('POST /auth/login - User Login', () => {
    it('should login with valid credentials', async () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('mock.jwt.token' as never);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.Success).toBe(true);
      expect(response.body.Message).toContain('Login successful');
      expect(response.body.Object.token).toBe('mock.jwt.token');
      expect(response.body.Object.user.email).toBe('john@example.com');
      expect(response.body.Object.user).not.toHaveProperty('password');
    });

    it('should return 401 for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Invalid credentials');
      expect(response.body.Errors).toContain('Email or password is incorrect');
    });

    it('should return 401 for incorrect password', async () => {
      const user = {
        id: 'user-123',
        email: 'john@example.com',
        name: 'John Doe',
        password: 'hashedpassword',
        role: Role.author,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Invalid credentials');
      expect(response.body.Errors).toContain('Email or password is incorrect');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('email'))).toBe(true);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('email'))).toBe(true);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
        })
        .expect(400);

      expect(response.body.Success).toBe(false);
      expect(response.body.Errors.some((e: string) => e.includes('password'))).toBe(true);
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/articles/me')
        .expect(401);

      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toContain('Authentication required');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/articles/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.Success).toBe(false);
    });

    it('should reject requests with malformed Bearer token', async () => {
      const response = await request(app)
        .get('/articles/me')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.Success).toBe(false);
    });
  });
});
