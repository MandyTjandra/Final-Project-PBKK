import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockConfig: any;
  let mockMail: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    mockJwt = {
      signAsync: vi.fn().mockResolvedValue('jwt_token_sample'),
      verify: vi.fn(),
    };
    mockConfig = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key.includes('SECRET')) return 'super_secret';
        if (key.includes('EXPIRATION')) return '1h';
        return null;
      }),
    };
    mockMail = {
      sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    };

    service = new AuthService(mockPrisma, mockJwt, mockConfig, mockMail);
  });

  describe('register', () => {
    it('should throw ConflictException if email is already in use', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'test@brewlab.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens when registration is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'new@brewlab.com',
        name: 'New Barista',
        role: 'BREWER',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register({
        email: 'new@brewlab.com',
        password: 'password123',
        name: 'New Barista',
      });

      expect(result.user.email).toBe('new@brewlab.com');
      expect(result.accessToken).toBe('jwt_token_sample');
      expect(result.refreshToken).toBe('jwt_token_sample');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@brewlab.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@brewlab.com',
        password: hashedPassword,
      });

      await expect(
        service.login({ email: 'user@brewlab.com', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens upon successful login', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@brewlab.com',
        password: hashedPassword,
        name: 'Barista',
        role: 'BREWER',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'user@brewlab.com',
        password: 'secret123',
      });

      expect(result.accessToken).toBe('jwt_token_sample');
      expect(result.user.name).toBe('Barista');
    });
  });
});
