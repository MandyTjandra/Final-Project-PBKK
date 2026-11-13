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

      const { reviews: _reviews, ...rest } = recipe;
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
      [BrewMethod.GULA_AREN_LATTE]: 11.0,
      [BrewMethod.MONT_BLANC]: 10.5,
      [BrewMethod.ESPRESSO_TONIC]: 10.0,
      [BrewMethod.DIRTY_LATTE]: 9.5,
      [BrewMethod.SPANISH_LATTE]: 11.5,
      [BrewMethod.EINSPANNER]: 9.0,
      [BrewMethod.ORANGE_ESPRESSO]: 10.0,
      [BrewMethod.JAPANESE_ICED_V60]: 15.0,
      [BrewMethod.V60_SWITCH]: 15.5,
      [BrewMethod.ORIGAMI_DRIPPER]: 15.5,
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

      case BrewMethod.GULA_AREN_LATTE: {
        recommendedWaterTemp = 4; // Chilled iced signature
        estimatedBrewTimeSeconds = 45;
        const espressoYield = Math.min(Math.round(dose * 2.0), totalWater);
        const arenSyrup = Math.round(totalWater * 0.13);
        const coldMilk = Math.max(0, totalWater - espressoYield - arenSyrup);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: arenSyrup,
            instruction: `Pour ${arenSyrup}g organic liquid Gula Aren syrup into iced glass and fill with crystal ice cubes.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 10,
            waterAmountMl: coldMilk,
            instruction: `Add ${coldMilk}ml chilled fresh milk (or oat milk) gently over the ice.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 20,
            waterAmountMl: espressoYield,
            instruction: `Extract ${espressoYield}g bold double espresso and float on top for signature Indonesian Kopi Susu Gula Aren layering.`,
          },
        ];
        break;
      }

      case BrewMethod.MONT_BLANC: {
        recommendedWaterTemp = 4; // Iced signature with whipped cream cap
        estimatedBrewTimeSeconds = 60;
        const coffeeBase = Math.round(totalWater * 0.68);
        const creamCap = Math.max(0, totalWater - coffeeBase);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: coffeeBase,
            instruction: `Combine ${coffeeBase}ml chilled double espresso & cold filtered water over clear ice with 10ml vanilla/maple syrup.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 30,
            waterAmountMl: creamCap,
            instruction: `Float ${creamCap}g lightly whipped heavy cream foam on top using the back of a spoon.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 50,
            waterAmountMl: 0,
            instruction: `Grate fresh orange zest and nutmeg directly over the snow-white cream cap to finish the Mont Blanc.`,
          },
        ];
        break;
      }

      case BrewMethod.ESPRESSO_TONIC: {
        recommendedWaterTemp = 5;
        estimatedBrewTimeSeconds = 45;
        const espressoYield = Math.min(Math.round(dose * 2.0), totalWater);
        const tonicWater = Math.max(0, totalWater - espressoYield);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: tonicWater,
            instruction: `Fill highball glass with ice, add citrus peel & rosemary sprig, then pour ${tonicWater}ml chilled botanical tonic water.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 15,
            waterAmountMl: espressoYield,
            instruction: `Slowly pour ${espressoYield}g bright fruity espresso over a spoon to prevent foaming and keep crisp layers.`,
          },
        ];
        break;
      }

      case BrewMethod.DIRTY_LATTE: {
        recommendedWaterTemp = 4;
        estimatedBrewTimeSeconds = 40;
        const ristrettoYield = Math.min(Math.round(dose * 1.8), totalWater);
        const chilledMilk = Math.max(0, totalWater - ristrettoYield);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: chilledMilk,
            instruction: `Pour ${chilledMilk}ml extra-chilled creamy milk (4°C) into a freezer-frosted glass (no ice).`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 15,
            waterAmountMl: ristrettoYield,
            instruction: `Pull ${ristrettoYield}g hot double ristretto directly over the cold milk surface so espresso cascades downward.`,
          },
        ];
        break;
      }

      case BrewMethod.SPANISH_LATTE: {
        recommendedWaterTemp = 5;
        estimatedBrewTimeSeconds = 50;
        const condensedMilk = Math.round(totalWater * 0.14);
        const espressoYield = Math.min(Math.round(dose * 2.0), Math.max(0, totalWater - condensedMilk));
        const coldMilk = Math.max(0, totalWater - condensedMilk - espressoYield);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: condensedMilk + espressoYield,
            instruction: `Dissolve ${condensedMilk}g sweetened condensed milk with ${espressoYield}g hot double espresso and stir until silky.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 30,
            waterAmountMl: coldMilk,
            instruction: `Add ice cubes and top up with ${coldMilk}ml cold whole milk; finish with a light dusting of cinnamon.`,
          },
        ];
        break;
      }

      case BrewMethod.EINSPANNER: {
        recommendedWaterTemp = 60;
        estimatedBrewTimeSeconds = 55;
        const coffeeBase = Math.round(totalWater * 0.65);
        const creamCap = Math.max(0, totalWater - coffeeBase);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: coffeeBase,
            instruction: `Prepare ${coffeeBase}ml rich espresso + hot water base in a pre-warmed fluted glass.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 35,
            waterAmountMl: creamCap,
            instruction: `Layer ${creamCap}g cold, softly whipped sweet cream gently over the coffee without stirring.`,
          },
        ];
        break;
      }

      case BrewMethod.ORANGE_ESPRESSO: {
        recommendedWaterTemp = 6;
        estimatedBrewTimeSeconds = 45;
        const espressoYield = Math.min(Math.round(dose * 2.0), totalWater);
        const orangeJuice = Math.max(0, totalWater - espressoYield);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: orangeJuice,
            instruction: `Fill glass with clear ice and pour ${orangeJuice}ml fresh cold-pressed Valencia orange juice.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 15,
            waterAmountMl: espressoYield,
            instruction: `Float ${espressoYield}g bright double espresso slowly onto the juice to create crisp golden-amber layers.`,
          },
        ];
        break;
      }

      case BrewMethod.JAPANESE_ICED_V60: {
        recommendedWaterTemp = 93;
        estimatedBrewTimeSeconds = 165;
        const iceWeight = Math.round(totalWater * 0.4);
        const hotWater = Math.max(0, totalWater - iceWeight);
        const bloom = Math.min(Math.round(dose * 2.5), hotWater);
        const pour2 = Math.round((hotWater - bloom) * 0.5);
        const pour3 = Math.max(0, hotWater - bloom - pour2);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: iceWeight + bloom,
            instruction: `Place ${iceWeight}g ice in server. Bloom coffee bed with ${bloom}g hot water (93°C) and swirl gently.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 40,
            waterAmountMl: pour2,
            instruction: `Pour ${pour2}g hot water in slow concentric spirals to keep slurry lively.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 85,
            waterAmountMl: pour3,
            instruction: `Pour final ${pour3}g hot water. Swirl iced carafe once drawdown completes to flash-chill aromatics.`,
          },
        ];
        break;
      }

      case BrewMethod.V60_SWITCH: {
        recommendedWaterTemp = 92;
        estimatedBrewTimeSeconds = 180;
        const bloom = Math.min(Math.round(dose * 3.0), totalWater);
        const steepWater = Math.max(0, totalWater - bloom);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: bloom,
            instruction: `Switch valve OPEN: bloom with ${bloom}g water at 92°C and swirl for 35s.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 40,
            waterAmountMl: steepWater,
            instruction: `Close Switch valve: pour ${steepWater}g water and let coffee steep by immersion until 1:45.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 105,
            waterAmountMl: 0,
            instruction: `Flip Switch valve OPEN at 1:45 and allow smooth, syrupy drawdown to finish by 3:00.`,
          },
        ];
        break;
      }

      case BrewMethod.ORIGAMI_DRIPPER: {
        recommendedWaterTemp = 93;
        estimatedBrewTimeSeconds = 150;
        const bloom = Math.min(Math.round(dose * 2.5), totalWater);
        const remaining = Math.max(0, totalWater - bloom);
        const pour2 = Math.round(remaining * 0.35);
        const pour3 = Math.round(remaining * 0.35);
        const pour4 = Math.max(0, remaining - pour2 - pour3);
        generatedSteps = [
          {
            stepOrder: 1,
            startTimeSeconds: 0,
            waterAmountMl: bloom,
            instruction: `Bloom ${bloom}g in Origami with conical paper filter for crisp bypass-free saturation.`,
          },
          {
            stepOrder: 2,
            startTimeSeconds: 35,
            waterAmountMl: pour2,
            instruction: `Second pour ${pour2}g steady center stream to boost sweetness.`,
          },
          {
            stepOrder: 3,
            startTimeSeconds: 70,
            waterAmountMl: pour3,
            instruction: `Third pour ${pour3}g in fast concentric circles.`,
          },
          {
            stepOrder: 4,
            startTimeSeconds: 105,
            waterAmountMl: pour4,
            instruction: `Final pour ${pour4}g and let ribbed channels drain cleanly by 2:30.`,
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
