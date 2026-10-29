import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../common/enums/role.enum.js';
import { BrewMethod, Difficulty } from '../common/enums/coffee.enum.js';
import { CalculateRatioDto } from './dto/calculate-ratio.dto.js';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { QueryRecipeDto } from './dto/query-recipe.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRecipeDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { grindSize: { contains: query.search } },
      ];
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.coffeeBeanId) {
      where.coffeeBeanId = query.coffeeBeanId;
    }

    const [items, total] = await Promise.all([
      this.prisma.brewRecipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
          coffeeBean: {
            select: { id: true, name: true, origin: true, roastLevel: true, imageUrl: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { pourSteps: true, reviews: true, favorites: true },
          },
        },
      }),
      this.prisma.brewRecipe.count({ where }),
    ]);

    // Calculate aggregate average rating for each recipe
    const recipesWithAvgRating = items.map((recipe) => {
      const avgRating =
        recipe.reviews.length > 0
          ? Number(
              (
                recipe.reviews.reduce((acc, r) => acc + r.rating, 0) /
                recipe.reviews.length
              ).toFixed(1),
            )
          : null;

      const { reviews, ...rest } = recipe;
      return {
        ...rest,
        averageRating: avgRating,
      };
    });

    return {
      data: recipesWithAvgRating,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const recipe = await this.prisma.brewRecipe.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        coffeeBean: true,
        pourSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: {
          select: { favorites: true },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Brew recipe with ID '${id}' not found`);
    }

    const avgRating =
      recipe.reviews.length > 0
        ? Number(
            (
              recipe.reviews.reduce((acc, r) => acc + r.rating, 0) /
              recipe.reviews.length
            ).toFixed(1),
          )
        : null;

    return {
      ...recipe,
      averageRating: avgRating,
    };
  }

  async create(userId: string, dto: CreateRecipeDto) {
    return this.prisma.brewRecipe.create({
      data: {
        userId,
        coffeeBeanId: dto.coffeeBeanId,
        title: dto.title,
        method: dto.method,
        grindSize: dto.grindSize,
        coffeeDoseGrams: dto.coffeeDoseGrams,
        targetRatio: dto.targetRatio,
        totalWaterMl: dto.totalWaterMl,
        waterTempCelsius: dto.waterTempCelsius,
        totalBrewTimeSeconds: dto.totalBrewTimeSeconds,
        difficulty: dto.difficulty ?? Difficulty.BEGINNER,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
        pourSteps: {
          create: dto.pourSteps.map((step) => ({
            stepOrder: step.stepOrder,
            startTimeSeconds: step.startTimeSeconds,
            waterAmountMl: step.waterAmountMl,
            instruction: step.instruction,
          })),
        },
      },
      include: {
        pourSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateRecipeDto) {
    const existing = await this.prisma.brewRecipe.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Brew recipe with ID '${id}' not found`);
    }

    if (existing.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this recipe');
    }

    return this.prisma.$transaction(async (tx) => {
      // If new pour steps provided, replace existing ones
      if (dto.pourSteps && dto.pourSteps.length > 0) {
        await tx.pourStep.deleteMany({
          where: { recipeId: id },
        });

        await tx.pourStep.createMany({
          data: dto.pourSteps.map((step) => ({
            recipeId: id,
            stepOrder: step.stepOrder,
            startTimeSeconds: step.startTimeSeconds,
            waterAmountMl: step.waterAmountMl,
            instruction: step.instruction,
          })),
        });
      }

      return tx.brewRecipe.update({
        where: { id },
        data: {
          ...(dto.coffeeBeanId !== undefined && { coffeeBeanId: dto.coffeeBeanId }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.method !== undefined && { method: dto.method }),
          ...(dto.grindSize !== undefined && { grindSize: dto.grindSize }),
          ...(dto.coffeeDoseGrams !== undefined && { coffeeDoseGrams: dto.coffeeDoseGrams }),
          ...(dto.targetRatio !== undefined && { targetRatio: dto.targetRatio }),
          ...(dto.totalWaterMl !== undefined && { totalWaterMl: dto.totalWaterMl }),
          ...(dto.waterTempCelsius !== undefined && { waterTempCelsius: dto.waterTempCelsius }),
          ...(dto.totalBrewTimeSeconds !== undefined && {
            totalBrewTimeSeconds: dto.totalBrewTimeSeconds,
          }),
          ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        },
        include: {
          pourSteps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const existing = await this.prisma.brewRecipe.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Brew recipe with ID '${id}' not found`);
    }

    if (existing.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this recipe');
    }

    await this.prisma.brewRecipe.delete({
      where: { id },
    });

    return { message: 'Recipe deleted successfully' };
  }

  calculateRatio(dto: CalculateRatioDto) {
    const defaultRatios: Record<string, number> = {
      [BrewMethod.V60]: 15.0,
      [BrewMethod.AEROPRESS]: 11.0,
      [BrewMethod.KALITA_WAVE]: 16.0,
      [BrewMethod.FRENCH_PRESS]: 14.0,
      [BrewMethod.COLD_BREW]: 8.0,
      [BrewMethod.ESPRESSO]: 2.0,
      [BrewMethod.CAFE_LATTE]: 12.0,
      [BrewMethod.CAPPUCCINO]: 8.5,
      [BrewMethod.FLAT_WHITE]: 8.0,
      [BrewMethod.AMERICANO]: 10.0,
    };

    const ratio = dto.targetRatio || defaultRatios[dto.method] || 15.0;
    const dose = dto.coffeeDoseGrams;
    const totalWater = Math.round(dose * ratio);

    let recommendedWaterTemp = 93;
    let estimatedBrewTimeSeconds = 180;
    let generatedSteps: Array<{
      stepOrder: number;
      startTimeSeconds: number;
      waterAmountMl: number;
      instruction: string;
    }> = [];

    switch (dto.method) {
      case BrewMethod.V60: {
        recommendedWaterTemp = 92;
        estimatedBrewTimeSeconds = 195; // 3m 15s
        const bloom = Math.round(dose * 2.5);
        const remaining = totalWater - bloom;
        const pour2 = Math.round(remaining * 0.4);
        const pour3 = totalWater - bloom - pour2;

        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: bloom,
            instruction: `Bloom: pour ${bloom}g of water evenly over coffee bed. Swirl gently for 40s.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 45,
            waterAmountMl: pour2,
            instruction: `Second Pour: spiral gently up to ${bloom + pour2}g in steady circles.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 90,
            waterAmountMl: pour3,
            instruction: `Final Pour: pour remaining up to ${totalWater}g by 1:30. Let bed draw down completely.`,
          },
        ];
        break;
      }

      case BrewMethod.AEROPRESS: {
        recommendedWaterTemp = 86;
        estimatedBrewTimeSeconds = 120; // 2m
        const halfWater = Math.round(totalWater / 2);
        const remainingWater = totalWater - halfWater;

        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: halfWater,
            instruction: `Add ${halfWater}g water, agitate slurry with paddle for 15 seconds.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 30,
            waterAmountMl: remainingWater,
            instruction: `Fill chamber up to ${totalWater}g total. Attach cap and create seal.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 75,
            waterAmountMl: 0,
            instruction: `Press plunger smoothly and steadily down for 30-40 seconds.`,
          },
        ];
        break;
      }

      case BrewMethod.KALITA_WAVE: {
        recommendedWaterTemp = 93;
        estimatedBrewTimeSeconds = 210;
        const stepWater = Math.round(totalWater / 4);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: stepWater,
            instruction: `Bloom ${stepWater}g in small center circles.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 40,
            waterAmountMl: stepWater,
            instruction: `Second pulse pour ${stepWater}g.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 80,
            waterAmountMl: stepWater,
            instruction: `Third pulse pour ${stepWater}g.`,
          },
          {
            stepOrder: 4,
            startTimeSeconds: 120,
            waterAmountMl: totalWater - stepWater * 3,
            instruction: `Final pulse pour up to ${totalWater}g.`,
          },
        ];
        break;
      }

      case BrewMethod.FRENCH_PRESS: {
        recommendedWaterTemp = 95;
        estimatedBrewTimeSeconds = 300; // 5 mins
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: totalWater,
            instruction: `Pour all ${totalWater}g boiling water aggressively to saturate all grinds.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 240,
            waterAmountMl: 0,
            instruction: `At 4:00, gently stir crust on top and skim off white foam.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 300,
            waterAmountMl: 0,
            instruction: `Insert press plunger just beneath surface (do not push to bottom) and decant slowly.`,
          },
        ];
        break;
      }

      case BrewMethod.COLD_BREW: {
        recommendedWaterTemp = 22; // Room temp / cold
        estimatedBrewTimeSeconds = 43200; // 12 hours
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: totalWater,
            instruction: `Combine ${dose}g coarse grinds with ${totalWater}g cold filtered water in jar. Stir well.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 43200,
            waterAmountMl: 0,
            instruction: `After 12-16 hours steep time, filter through paper or fine mesh. Store concentrate in fridge.`,
          },
        ];
        break;
      }

      case BrewMethod.CAFE_LATTE: {
        recommendedWaterTemp = 65; // Sweet spot for steamed milk lactose
        estimatedBrewTimeSeconds = 60;
        const espressoYield = Math.round(dose * 2.0);
        const milkAmount = totalWater - espressoYield;
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: espressoYield,
            instruction: `Extract double espresso (${dose}g in -> ${espressoYield}g out in 27-30s) into pre-warmed cup with thick crema.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 30,
            waterAmountMl: milkAmount,
            instruction: `Steam ${milkAmount}g fresh whole milk to 60-65°C creating velvety, glossy wet microfoam (paint-like texture).`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 50,
            waterAmountMl: 0,
            instruction: `Integrate milk into espresso base and pour latte art with 1cm microfoam cap.`,
          },
        ];
        break;
      }

      case BrewMethod.CAPPUCCINO: {
        recommendedWaterTemp = 65;
        estimatedBrewTimeSeconds = 55;
        const espressoYield = Math.round(dose * 2.0);
        const milkAmount = totalWater - espressoYield;
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: espressoYield,
            instruction: `Extract ${espressoYield}g dense double espresso into traditional 180ml ceramic cup.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 30,
            waterAmountMl: milkAmount,
            instruction: `Aerate ${milkAmount}g milk with deep rolling vortex to build 2cm thick, pillow-soft microfoam.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 45,
            waterAmountMl: 0,
            instruction: `Pour steadily into center creating classic white foam circle ringed by dark golden crema.`,
          },
        ];
        break;
      }

      case BrewMethod.FLAT_WHITE: {
        recommendedWaterTemp = 62;
        estimatedBrewTimeSeconds = 50;
        const ristrettoYield = Math.round(dose * 1.8);
        const milkAmount = totalWater - ristrettoYield;
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: ristrettoYield,
            instruction: `Extract double ristretto (${dose}g in -> ${ristrettoYield}g out in 22s) for sweeter, concentrated coffee core.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 25,
            waterAmountMl: milkAmount,
            instruction: `Steam ${milkAmount}g milk with ultra-silky microfoam (glossy finish with barely 5mm foam depth).`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 40,
            waterAmountMl: 0,
            instruction: `Pour flat, seamless surface allowing rich coffee intensity to dominate each sip.`,
          },
        ];
        break;
      }

      case BrewMethod.AMERICANO: {
        recommendedWaterTemp = 85;
        estimatedBrewTimeSeconds = 45;
        const espressoYield = Math.round(dose * 2.0);
        const waterBase = totalWater - espressoYield;
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: waterBase,
            instruction: `Pour ${waterBase}ml hot filtered water at 85°C into cup first (Long Black style).`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 15,
            waterAmountMl: espressoYield,
            instruction: `Extract ${espressoYield}g double espresso directly floating on top of hot water to preserve golden crema.`,
          },
        ];
        break;
      }

      case BrewMethod.ESPRESSO: {
        recommendedWaterTemp = 93;
        estimatedBrewTimeSeconds = 30;
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: totalWater,
            instruction: `Distribute grinds with WDT tool, tamp level at 15kg pressure, extract 1:2 ratio (${dose}g in -> ${totalWater}g out) in 28-30s.`,
          },
        ];
        break;
      }
    }

    return {
      coffeeDoseGrams: dose,
      targetRatio: ratio,
      totalWaterMl: totalWater,
      recommendedWaterTemp,
      estimatedBrewTimeSeconds,
      method: dto.method,
      generatedPourSteps: generatedSteps,
    };
  }
}
