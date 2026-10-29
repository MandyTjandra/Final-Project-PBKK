import { describe, expect, it, beforeEach } from 'vitest';
import { RecipesService } from './recipes.service.js';
import { BrewMethod } from '../common/enums/coffee.enum.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('RecipesService (Unit Tests)', () => {
  let service: RecipesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      brewRecipe: {
        findMany: () => Promise.resolve([]),
        count: () => Promise.resolve(0),
        findUnique: () => Promise.resolve(null),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({}),
      },
      pourStep: {
        deleteMany: () => Promise.resolve({ count: 0 }),
        createMany: () => Promise.resolve({ count: 0 }),
      },
      $transaction: (cb: any) => cb(mockPrisma),
    };
    service = new RecipesService(mockPrisma as PrismaService);
  });

  describe('calculateRatio', () => {
    it('should calculate V60 ratio correctly with bloom and pour phases', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 15,
        targetRatio: 15,
        method: BrewMethod.V60,
      });

      expect(result.coffeeDoseGrams).toBe(15);
      expect(result.targetRatio).toBe(15);
      expect(result.totalWaterMl).toBe(225);
      expect(result.recommendedWaterTemp).toBe(92);
      expect(result.generatedPourSteps.length).toBe(3);
      expect(result.generatedPourSteps[0].stepOrder).toBe(1);
      expect(result.generatedPourSteps[0].waterAmountMl).toBe(38); // Math.round(15 * 2.5)
    });

    it('should calculate AeroPress ratio with agitation and plunge phases', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 18,
        method: BrewMethod.AEROPRESS,
      });

      expect(result.coffeeDoseGrams).toBe(18);
      expect(result.targetRatio).toBe(11);
      expect(result.totalWaterMl).toBe(198); // 18 * 11
      expect(result.recommendedWaterTemp).toBe(86);
      expect(result.generatedPourSteps.length).toBe(3);
    });

    it('should calculate Kalita Wave with 4 pulse pours', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 20,
        targetRatio: 16,
        method: BrewMethod.KALITA_WAVE,
      });

      expect(result.totalWaterMl).toBe(320);
      expect(result.generatedPourSteps.length).toBe(4);
    });

    it('should calculate French Press with immersion time and plunge', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 20,
        method: BrewMethod.FRENCH_PRESS,
      });

      expect(result.totalWaterMl).toBe(280);
      expect(result.recommendedWaterTemp).toBe(95);
      expect(result.estimatedBrewTimeSeconds).toBe(300);
    });

    it('should calculate Cold Brew with room temperature and long steep', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 50,
        method: BrewMethod.COLD_BREW,
      });

      expect(result.totalWaterMl).toBe(400); // 50 * 8
      expect(result.recommendedWaterTemp).toBe(22);
      expect(result.estimatedBrewTimeSeconds).toBe(43200);
    });

    it('should calculate Cafe Latte ratio with espresso base and steamed milk', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 18,
        method: BrewMethod.CAFE_LATTE,
      });

      expect(result.totalWaterMl).toBe(216); // 18 * 12
      expect(result.recommendedWaterTemp).toBe(65);
      expect(result.generatedPourSteps.length).toBe(3);
      expect(result.generatedPourSteps[0].waterAmountMl).toBe(36); // 18 * 2
    });

    it('should calculate Cappuccino with 2cm microfoam ratio', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 18,
        method: BrewMethod.CAPPUCCINO,
      });

      expect(result.totalWaterMl).toBe(153); // 18 * 8.5
      expect(result.recommendedWaterTemp).toBe(65);
    });

    it('should calculate Flat White with double ristretto ratio', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 19,
        method: BrewMethod.FLAT_WHITE,
      });

      expect(result.totalWaterMl).toBe(152); // 19 * 8
      expect(result.recommendedWaterTemp).toBe(62);
    });

    it('should calculate Americano / Long Black with hot water base', () => {
      const result = service.calculateRatio({
        coffeeDoseGrams: 18,
        method: BrewMethod.AMERICANO,
      });

      expect(result.totalWaterMl).toBe(180); // 18 * 10
      expect(result.recommendedWaterTemp).toBe(85);
      expect(result.generatedPourSteps[0].waterAmountMl).toBe(144);
    });
  });
});
