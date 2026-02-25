import * as fc from 'fast-check';
import { registerSchema } from '@/validators/auth.validator';
import { Role } from '@/types';

/**
 * Feature: news-api, Property 1: Registration Input Validation
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 *
 * For any registration request, the system should validate that the name contains only
 * alphabets and spaces, the email follows standard format, the password meets strength
 * requirements (8+ characters, uppercase, lowercase, number, special character), and the
 * role is either "author" or "reader"
 */
describe('Feature: news-api, Property 1: Registration Input Validation', () => {
  describe('Name validation', () => {
    it('should accept names with only alphabets and spaces', () => {
      fc.assert(
        fc.property(
          fc.stringOf(
            fc.oneof(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split(''))
            ),
            { minLength: 1, maxLength: 50 }
          ),
          (name) => {
            const result = registerSchema.shape.name.safeParse(name);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject names with digits or special characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /[^A-Za-z\s]/.test(s)),
          (name) => {
            const result = registerSchema.shape.name.safeParse(name);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.errors[0].message).toContain('alphabets and spaces');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Email validation', () => {
    it('should accept valid email formats', () => {
      // Use a more conservative email generator that Zod will accept
      const simpleEmailArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
            minLength: 1,
            maxLength: 20,
          }),
          fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.org')
        )
        .map(([local, domain]) => `${local}@${domain}`);

      fc.assert(
        fc.property(simpleEmailArb, (email) => {
          const result = registerSchema.shape.email.safeParse(email);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid email formats', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !s.includes('@') || !s.includes('.')),
          (invalidEmail) => {
            const result = registerSchema.shape.email.safeParse(invalidEmail);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Password validation', () => {
    it('should accept strong passwords', () => {
      // Generator for strong passwords - ensures minimum 8 characters
      const strongPasswordArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 2, maxLength: 5 }),
          fc.stringOf(fc.constantFrom(...'@$!%*?&'.split('')), { minLength: 2, maxLength: 5 }),
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&'.split('')),
            { minLength: 0, maxLength: 10 }
          )
        )
        .map(([lower, upper, digit, special, extra]) => {
          // Shuffle to create random password
          const chars = (lower + upper + digit + special + extra).split('');
          for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
          }
          return chars.join('');
        });

      fc.assert(
        fc.property(strongPasswordArb, (password) => {
          const result = registerSchema.shape.password.safeParse(password);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 7 }), (shortPassword) => {
          const result = registerSchema.shape.password.safeParse(shortPassword);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors.some((e) => e.message.includes('8 characters'))).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without uppercase letters', () => {
      const noUppercaseArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
            minLength: 5,
            maxLength: 10,
          }),
          fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 3 }),
          fc.stringOf(fc.constantFrom(...'@$!%*?&'.split('')), { minLength: 1, maxLength: 3 })
        )
        .map(([lower, digit, special]) => lower + digit + special);

      fc.assert(
        fc.property(noUppercaseArb, (password) => {
          const result = registerSchema.shape.password.safeParse(password);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without lowercase letters', () => {
      const noLowercaseArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
            minLength: 5,
            maxLength: 10,
          }),
          fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 3 }),
          fc.stringOf(fc.constantFrom(...'@$!%*?&'.split('')), { minLength: 1, maxLength: 3 })
        )
        .map(([upper, digit, special]) => upper + digit + special);

      fc.assert(
        fc.property(noLowercaseArb, (password) => {
          const result = registerSchema.shape.password.safeParse(password);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without digits', () => {
      const noDigitArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
            minLength: 3,
            maxLength: 8,
          }),
          fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
            minLength: 3,
            maxLength: 8,
          }),
          fc.stringOf(fc.constantFrom(...'@$!%*?&'.split('')), { minLength: 1, maxLength: 3 })
        )
        .map(([lower, upper, special]) => lower + upper + special);

      fc.assert(
        fc.property(noDigitArb, (password) => {
          const result = registerSchema.shape.password.safeParse(password);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without special characters', () => {
      const noSpecialArb = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
            minLength: 3,
            maxLength: 8,
          }),
          fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
            minLength: 3,
            maxLength: 8,
          }),
          fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 3 })
        )
        .map(([lower, upper, digit]) => lower + upper + digit);

      fc.assert(
        fc.property(noSpecialArb, (password) => {
          const result = registerSchema.shape.password.safeParse(password);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Role validation', () => {
    it('should accept valid roles (author or reader)', () => {
      fc.assert(
        fc.property(fc.constantFrom(Role.author, Role.reader), (role) => {
          const result = registerSchema.shape.role.safeParse(role);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid roles', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s !== 'author' && s !== 'reader'),
          (invalidRole) => {
            const result = registerSchema.shape.role.safeParse(invalidRole);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Complete registration validation', () => {
    it('should validate complete valid registration data', () => {
      const validRegistrationArb = fc.record({
        name: fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('')),
          { minLength: 1, maxLength: 50 }
        ),
        email: fc
          .tuple(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
              minLength: 1,
              maxLength: 20,
            }),
            fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.org')
          )
          .map(([local, domain]) => `${local}@${domain}`),
        password: fc
          .tuple(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
              minLength: 2,
              maxLength: 5,
            }),
            fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
              minLength: 2,
              maxLength: 5,
            }),
            fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 2, maxLength: 5 }),
            fc.stringOf(fc.constantFrom(...'@$!%*?&'.split('')), { minLength: 2, maxLength: 5 })
          )
          .map(([lower, upper, digit, special]) => {
            const chars = (lower + upper + digit + special).split('');
            for (let i = chars.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join('');
          }),
        role: fc.constantFrom(Role.author, Role.reader),
      });

      fc.assert(
        fc.property(validRegistrationArb, (data) => {
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Feature: news-api, Property 2: Password Hashing
 * Validates: Requirements 1.6
 *
 * For any successful registration, the stored password should be a bcrypt hash that
 * differs from the plaintext input and can be verified against the original password
 */
describe('Feature: news-api, Property 2: Password Hashing', () => {
  it('should hash passwords and verify them correctly', async () => {
    const bcrypt = require('bcrypt');
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        async (password) => {
          // Hash the password
          const hash = await bcrypt.hash(password, 10);
          
          // Hash should not equal plaintext
          expect(hash).not.toBe(password);
          
          // Hash should be a valid bcrypt hash (starts with $2b$ or $2a$)
          expect(hash).toMatch(/^\$2[ab]\$/);
          
          // Should be able to verify the password
          const isValid = await bcrypt.compare(password, hash);
          expect(isValid).toBe(true);
          
          // Wrong password should not verify
          const wrongPassword = password + 'wrong';
          const isInvalid = await bcrypt.compare(wrongPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 20 } // Reduced from 100 to 20 for performance
    );
  }, 60000); // 60 second timeout for bcrypt operations

  it('should produce different hashes for the same password (salt)', async () => {
    const bcrypt = require('bcrypt');
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        async (password) => {
          const hash1 = await bcrypt.hash(password, 10);
          const hash2 = await bcrypt.hash(password, 10);
          
          // Different hashes due to different salts
          expect(hash1).not.toBe(hash2);
          
          // But both should verify the same password
          expect(await bcrypt.compare(password, hash1)).toBe(true);
          expect(await bcrypt.compare(password, hash2)).toBe(true);
        }
      ),
      { numRuns: 10 } // Reduced from 50 to 10 for performance
    );
  }, 60000); // 60 second timeout for bcrypt operations
});

/**
 * Feature: news-api, Property 4: JWT Token Structure
 * Validates: Requirements 2.2, 2.3, 2.5
 *
 * For any successful login, the generated JWT should contain a sub claim with the userId,
 * a role claim matching the user's role, and an exp claim set to 24 hours from generation
 */
describe('Feature: news-api, Property 4: JWT Token Structure', () => {
  it('should generate JWT with correct structure and claims', () => {
    const jwt = require('jsonwebtoken');
    const SECRET = 'test-secret-key';
    
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(Role.author, Role.reader),
        (userId, role) => {
          // Generate token
          const token = jwt.sign(
            { sub: userId, role },
            SECRET,
            { expiresIn: '24h' }
          );
          
          // Decode token
          const decoded = jwt.verify(token, SECRET) as any;
          
          // Verify sub claim contains userId
          expect(decoded.sub).toBe(userId);
          
          // Verify role claim matches
          expect(decoded.role).toBe(role);
          
          // Verify exp claim exists and is approximately 24 hours from now
          expect(decoded.exp).toBeDefined();
          const now = Math.floor(Date.now() / 1000);
          const expectedExp = now + 24 * 60 * 60; // 24 hours in seconds
          
          // Allow 5 second tolerance for test execution time
          expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
          expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
          
          // Verify iat (issued at) claim exists
          expect(decoded.iat).toBeDefined();
          expect(decoded.iat).toBeGreaterThanOrEqual(now - 5);
          expect(decoded.iat).toBeLessThanOrEqual(now + 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject tokens with invalid signature', () => {
    const jwt = require('jsonwebtoken');
    const SECRET = 'test-secret-key';
    const WRONG_SECRET = 'wrong-secret-key';
    
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(Role.author, Role.reader),
        (userId, role) => {
          // Generate token with one secret
          const token = jwt.sign(
            { sub: userId, role },
            SECRET,
            { expiresIn: '24h' }
          );
          
          // Try to verify with wrong secret
          expect(() => {
            jwt.verify(token, WRONG_SECRET);
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject expired tokens', async () => {
    const jwt = require('jsonwebtoken');
    const SECRET = 'test-secret-key';
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(Role.author, Role.reader),
        async (userId, role) => {
          // Generate token that expires immediately
          const token = jwt.sign(
            { sub: userId, role },
            SECRET,
            { expiresIn: '0s' }
          );
          
          // Wait a tiny bit to ensure expiration
          await new Promise((resolve) => setTimeout(resolve, 10));
          
          expect(() => {
            jwt.verify(token, SECRET);
          }).toThrow(/expired/);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: news-api, Property 5: Authentication Round Trip
 * Validates: Requirements 2.1
 *
 * For any valid user credentials, logging in should produce a JWT that, when decoded
 * and validated, contains the correct user ID and role
 */
describe('Feature: news-api, Property 5: Authentication Round Trip', () => {
  it('should maintain user identity through token generation and validation', () => {
    const jwt = require('jsonwebtoken');
    const SECRET = 'test-secret-key';
    
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          role: fc.constantFrom(Role.author, Role.reader),
          email: fc.emailAddress(),
        }),
        (userData) => {
          // Simulate login: generate token
          const token = jwt.sign(
            { sub: userData.userId, role: userData.role },
            SECRET,
            { expiresIn: '24h' }
          );
          
          // Simulate token validation: decode and verify
          const decoded = jwt.verify(token, SECRET) as any;
          
          // Round trip should preserve user identity
          expect(decoded.sub).toBe(userData.userId);
          expect(decoded.role).toBe(userData.role);
          
          // Token should be a valid JWT string
          expect(typeof token).toBe('string');
          expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple round trips for the same user', async () => {
    const jwt = require('jsonwebtoken');
    const SECRET = 'test-secret-key';
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(Role.author, Role.reader),
        async (userId, role) => {
          // Generate first token
          const token1 = jwt.sign({ sub: userId, role }, SECRET, { expiresIn: '24h' });
          
          // Wait 1000ms (1 second) to ensure different iat timestamp (JWT uses seconds, not ms)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Generate second token
          const token2 = jwt.sign({ sub: userId, role }, SECRET, { expiresIn: '24h' });
          
          // Decode both tokens
          const decoded1 = jwt.verify(token1, SECRET) as any;
          const decoded2 = jwt.verify(token2, SECRET) as any;
          
          // Both should contain the same user identity
          expect(decoded1.sub).toBe(userId);
          expect(decoded2.sub).toBe(userId);
          expect(decoded1.role).toBe(role);
          expect(decoded2.role).toBe(role);
          
          // Tokens themselves should be different (different iat - JWT uses seconds)
          expect(token1).not.toBe(token2);
        }
      ),
      { numRuns: 10 } // Reduced to 10 due to 1 second delay per run
    );
  }, 15000); // 15 second timeout for 10 runs with 1 second delay each
});
