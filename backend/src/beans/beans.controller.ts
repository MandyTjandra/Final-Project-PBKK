import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BeansService } from './beans.service.js';
import { CreateBeanDto } from './dto/create-bean.dto.js';
import { QueryBeanDto } from './dto/query-bean.dto.js';
import { UpdateBeanDto } from './dto/update-bean.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller('beans')
export class BeansController {
  constructor(private readonly beansService: BeansService) {}

  @Public()
  @Get()
  async findAll(@Query() query: QueryBeanDto) {
    return this.beansService.findAll(query);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.beansService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ROASTER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateBeanDto) {
    return this.beansService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ROASTER, Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateBeanDto,
  ) {
    return this.beansService.update(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ROASTER, Role.ADMIN)
  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.beansService.updateStock(id, userId, userRole, dto.stockGrams);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ROASTER, Role.ADMIN)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.beansService.remove(id, userId, userRole);
  }
}
