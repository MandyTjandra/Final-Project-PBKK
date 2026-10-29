import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, recipeId: string, dto: CreateReviewDto) {
    const recipe = await this.prisma.brewRecipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID '${recipeId}' not found`);
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        recipeId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return review;
  }

  async findByRecipe(recipeId: string) {
    const recipe = await this.prisma.brewRecipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID '${recipeId}' not found`);
    }

    return this.prisma.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }
}
