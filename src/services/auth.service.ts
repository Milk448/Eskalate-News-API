import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/config/database';
import { env } from '@/config/env';
import { AppError, JwtPayload, Role } from '@/types';
import { RegisterInput } from '@/validators/auth.validator';

// Type for User from Prisma
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Register a new user
   * Hashes password and creates user in database
   */
  async register(data: RegisterInput): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists', ['Email is already registered']);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password as string, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role as any,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  /**
   * Login user
   * Validates credentials and generates JWT token
   */
  async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials', ['Email or password is incorrect']);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials', ['Email or password is incorrect']);
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.role as any);

    // Return token and user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword as Omit<User, 'password'>,
    };
  }

  /**
   * Generate JWT token
   * Contains userId (sub) and role claims
   * Expires in 24 hours
   */
  generateToken(userId: string, role: User['role']): string {
    const payload: JwtPayload = {
      sub: userId,
      role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN || '24h',
    } as jwt.SignOptions);
  }

  /**
   * Validate JWT token
   * Returns decoded payload if valid
   */
  validateToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      if (!decoded.sub || !decoded.role) {
        throw new AppError(401, 'Invalid token', ['Token payload is malformed']);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Token expired', ['Authentication token has expired']);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid token', ['Authentication token is invalid']);
      }
      throw error;
    }
  }

  /**
   * Verify password hash
   * Used for testing password hashing
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default new AuthService();
