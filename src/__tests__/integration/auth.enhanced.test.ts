import request from 'supertest';
import { createApp } from '@/app';
import { Application } from 'express';
import { Role } from '@/types';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $use: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

import prisma from '@/config/database';

describe('Enhanced Authentication - User Story 1', () => {
  let app: Application;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register - Strong Password Validation', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test-enhanced-auth@example.com',
      role: 'author' as const,
    };

    it('should accept a strong password with all requirements', async () => {
      const newUser = {
        id: 'user-123',
        name: validUserData.name,
        email: validUserData.email,
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
          ...validUserData,
          password: 'StrongP@ss123',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Message).toBe('User registered successfully');
      expect(response.body.Object).toHaveProperty('id');
      expect(response.body.Object).toHaveProperty('email', validUserData.email);
      expect(response.body.Object).not.toHaveProperty('password');
      expect(response.body.Errors).toBeNull();
    });

    it('should reject password with less than 8 characters', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-short-pass@example.com',
          password: 'Short1!',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toBe('Validation failed');
      expect(response.body.Errors).toContain('password: Password must be at least 8 characters');
    });

    it('should reject password without uppercase letter', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-no-upper@example.com',
          password: 'weakpass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
      expect(response.body.Errors.some((e: string) => 
        e.includes('uppercase')
      )).toBe(true);
    });

    it('should reject password without lowercase letter', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-no-lower@example.com',
          password: 'WEAKPASS123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
      expect(response.body.Errors.some((e: string) => 
        e.includes('lowercase')
      )).toBe(true);
    });

    it('should reject password without number', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-no-number@example.com',
          password: 'WeakPass!',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
      expect(response.body.Errors.some((e: string) => 
        e.includes('number')
      )).toBe(true);
    });

    it('should reject password without special character', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-no-special@example.com',
          password: 'WeakPass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
      expect(response.body.Errors.some((e: string) => 
        e.includes('special character')
      )).toBe(true);
    });
  });

  describe('POST /auth/register - Role Validation', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test-role-validation@example.com',
      password: 'StrongP@ss123',
    };

    it('should accept valid role: author', async () => {
      const newUser = {
        id: 'user-123',
        name: validUserData.name,
        email: 'test-author-role@example.com',
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
          ...validUserData,
          email: 'test-author-role@example.com',
          role: 'author',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.role).toBe(Role.author);
    });

    it('should accept valid role: reader', async () => {
      const newUser = {
        id: 'user-124',
        name: validUserData.name,
        email: 'test-reader-role@example.com',
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-reader-role@example.com',
          role: 'reader',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object.role).toBe(Role.reader);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'test-invalid-role@example.com',
          role: 'admin', // Invalid role
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toBe('Validation failed');
      expect(response.body.Errors).toBeDefined();
      expect(response.body.Errors.some((e: string) => 
        e.includes("Role must be either 'author' or 'reader'")
      )).toBe(true);
    });

    it('should reject missing role', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: validUserData.name,
          email: 'test-missing-role@example.com',
          password: validUserData.password,
          // role is missing
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toBe('Validation failed');
      expect(response.body.Errors).toBeDefined();
    });
  });

  describe('POST /auth/register - Duplicate Email Handling', () => {
    const userData = {
      name: 'Test User',
      email: 'test-duplicate-enhanced@example.com',
      password: 'StrongP@ss123',
      role: 'reader' as const,
    };

    it('should return 409 Conflict for duplicate email', async () => {
      const existingUser = {
        id: 'user-123',
        name: userData.name,
        email: userData.email,
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First registration - simulate existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser as any);

      // Second registration with same email - should fail with 409
      const secondResponse = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.Success).toBe(false);
      expect(secondResponse.body.Message).toBe('User already exists');
      expect(secondResponse.body.Object).toBeNull();
      expect(secondResponse.body.Errors).toEqual(['Email is already registered']);
    });

    it('should return proper error structure for duplicate email', async () => {
      const existingUser = {
        id: 'user-124',
        name: userData.name,
        email: 'test-duplicate-structure@example.com',
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser as any);

      // Try to create again
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          email: 'test-duplicate-structure@example.com',
        });

      // Verify response structure matches specification
      expect(response.body).toHaveProperty('Success', false);
      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('Object', null);
      expect(response.body).toHaveProperty('Errors');
      expect(Array.isArray(response.body.Errors)).toBe(true);
      expect(response.body.Errors.length).toBeGreaterThan(0);
    });
  });

  describe('Response Structure Validation', () => {
    it('should return correct response structure on successful registration', async () => {
      const newUser = {
        id: 'user-125',
        name: 'Structure Test',
        email: 'test-structure-success@example.com',
        password: 'hashedpassword',
        role: Role.reader,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Structure Test',
          email: 'test-structure-success@example.com',
          password: 'StrongP@ss123',
          role: 'reader',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Success', true);
      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('Object');
      expect(response.body).toHaveProperty('Errors', null);
      expect(response.body.Object).not.toBeNull();
    });

    it('should return correct response structure on validation error', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Structure Test',
          email: 'invalid-email',
          password: 'weak',
          role: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('Success', false);
      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('Object', null);
      expect(response.body).toHaveProperty('Errors');
      expect(Array.isArray(response.body.Errors)).toBe(true);
    });
  });
});
