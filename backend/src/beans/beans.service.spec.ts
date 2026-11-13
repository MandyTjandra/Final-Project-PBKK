import { describe, expect, it, beforeEach, vi } from 'vitest';
import { BeansService } from './beans.service.js';
import { Role } from '../common/enums/role.enum.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BeansService (Unit Tests)', () => {
  let service: BeansService;
  let mockPrisma: any;
  let mockMail: any;

  beforeEach(() => {
    mockPrisma = {
      coffeeBean: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    mockMail = {
      sendLowStockAlert: vi.fn().mockResolvedValue(true),
    };
    service = new BeansService(mockPrisma, mockMail);
  });

  describe('findOne', () => {
    it('should throw NotFoundException if bean is not found', async () => {
      mockPrisma.coffeeBean.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return bean if found', async () => {
      const bean = { id: 'bean-1', name: 'Ethiopia Yirgacheffe' };
      mockPrisma.coffeeBean.findUnique.mockResolvedValue(bean);
      const result = await service.findOne('bean-1');
      expect(result).toEqual(bean);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not the owner and not admin', async () => {
      mockPrisma.coffeeBean.findUnique.mockResolvedValue({
        id: 'bean-1',
        roasterId: 'roaster-1',
        roaster: { email: 'roaster@test.com', name: 'Roaster' },
      });

      await expect(
        service.update('bean-1', 'different-user', Role.BREWER, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update and trigger low stock mail if stock <= threshold', async () => {
      mockPrisma.coffeeBean.findUnique.mockResolvedValue({
        id: 'bean-1',
        roasterId: 'roaster-1',
        roaster: { email: 'roaster@test.com', name: 'Roaster' },
      });

      mockPrisma.coffeeBean.update.mockResolvedValue({
        id: 'bean-1',
        name: 'Gayo Anaerobic',
        stockGrams: 300,
        minStockThreshold: 500,
      });

      await service.update('bean-1', 'roaster-1', Role.ROASTER, { stockGrams: 300 });

      expect(mockMail.sendLowStockAlert).toHaveBeenCalledWith(
        'roaster@test.com',
        'Roaster',
        'Gayo Anaerobic',
        300,
        500,
      );
    });
  });
});
