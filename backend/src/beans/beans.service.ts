import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateBeanDto } from './dto/create-bean.dto.js';
import { QueryBeanDto } from './dto/query-bean.dto.js';
import { UpdateBeanDto } from './dto/update-bean.dto.js';

@Injectable()
export class BeansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll(query: QueryBeanDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      const search = query.search;
      where.OR = [
        { name: { contains: search } },
        { origin: { contains: search } },
        { tastingNotes: { contains: search } },
        { varietal: { contains: search } },
      ];
    }

    if (query.roastLevel) {
      where.roastLevel = query.roastLevel;
    }

    if (query.process) {
      where.process = query.process;
    }

    if (query.origin) {
      where.origin = { contains: query.origin };
    }

    const [items, total] = await Promise.all([
      this.prisma.coffeeBean.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roaster: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { recipes: true },
          },
        },
      }),
      this.prisma.coffeeBean.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const bean = await this.prisma.coffeeBean.findUnique({
      where: { id },
      include: {
        roaster: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        recipes: {
          where: { isPublic: true },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
    });

    if (!bean) {
      throw new NotFoundException(`Coffee bean with ID '${id}' not found`);
    }

    return bean;
  }

  async create(roasterId: string, dto: CreateBeanDto) {
    return this.prisma.coffeeBean.create({
      data: {
        roasterId,
        name: dto.name,
        origin: dto.origin,
        farmOrStation: dto.farmOrStation,
        varietal: dto.varietal,
        process: dto.process,
        roastLevel: dto.roastLevel,
        altitudeMasl: dto.altitudeMasl,
        stockGrams: dto.stockGrams,
        minStockThreshold: dto.minStockThreshold ?? 500,
        price: dto.price,
        bagSizeGrams: dto.bagSizeGrams ?? 250,
        imageUrl: dto.imageUrl,
        tastingWheelUrl: dto.tastingWheelUrl,
        description: dto.description,
        tastingNotes: dto.tastingNotes,
      },
      include: {
        roaster: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateBeanDto) {
    const bean = await this.prisma.coffeeBean.findUnique({
      where: { id },
      include: { roaster: true },
    });

    if (!bean) {
      throw new NotFoundException(`Coffee bean with ID '${id}' not found`);
    }

    // Owner or ADMIN check
    if (bean.roasterId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this bean');
    }

    const updated = await this.prisma.coffeeBean.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.farmOrStation !== undefined && { farmOrStation: dto.farmOrStation }),
        ...(dto.varietal !== undefined && { varietal: dto.varietal }),
        ...(dto.process !== undefined && { process: dto.process }),
        ...(dto.roastLevel !== undefined && { roastLevel: dto.roastLevel }),
        ...(dto.altitudeMasl !== undefined && { altitudeMasl: dto.altitudeMasl }),
        ...(dto.stockGrams !== undefined && { stockGrams: dto.stockGrams }),
        ...(dto.minStockThreshold !== undefined && { minStockThreshold: dto.minStockThreshold }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.bagSizeGrams !== undefined && { bagSizeGrams: dto.bagSizeGrams }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.tastingWheelUrl !== undefined && { tastingWheelUrl: dto.tastingWheelUrl }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.tastingNotes !== undefined && { tastingNotes: dto.tastingNotes }),
      },
    });

    // Check low stock condition if stock was updated
    if (dto.stockGrams !== undefined && dto.stockGrams <= updated.minStockThreshold) {
      this.mailService
        .sendLowStockAlert(
          bean.roaster.email,
          bean.roaster.name,
          updated.name,
          updated.stockGrams,
          updated.minStockThreshold,
        )
        .catch(() => {});
    }

    return updated;
  }

  async updateStock(id: string, userId: string, userRole: string, stockGrams: number) {
    const bean = await this.prisma.coffeeBean.findUnique({
      where: { id },
      include: { roaster: true },
    });

    if (!bean) {
      throw new NotFoundException(`Coffee bean with ID '${id}' not found`);
    }

    if (bean.roasterId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this bean stock');
    }

    const updated = await this.prisma.coffeeBean.update({
      where: { id },
      data: { stockGrams },
    });

    if (stockGrams <= updated.minStockThreshold) {
      this.mailService
        .sendLowStockAlert(
          bean.roaster.email,
          bean.roaster.name,
          updated.name,
          stockGrams,
          updated.minStockThreshold,
        )
        .catch(() => {});
    }

    return updated;
  }

  async remove(id: string, userId: string, userRole: string) {
    const bean = await this.prisma.coffeeBean.findUnique({
      where: { id },
    });

    if (!bean) {
      throw new NotFoundException(`Coffee bean with ID '${id}' not found`);
    }

    if (bean.roasterId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this bean');
    }

    await this.prisma.coffeeBean.delete({
      where: { id },
    });

    return { message: 'Coffee bean deleted successfully' };
  }
}
