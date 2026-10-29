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
import { RecipesService } from './recipes.service.js';
import { CalculateRatioDto } from './dto/calculate-ratio.dto.js';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { QueryRecipeDto } from './dto/query-recipe.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  async findAll(@Query() query: QueryRecipeDto) {
    return this.recipesService.findAll(query);
  }

  @Public()
  @Post('calculate-ratio')
  @HttpCode(HttpStatus.OK)
  calculateRatio(@Body() dto: CalculateRatioDto) {
    return this.recipesService.calculateRatio(dto);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.recipesService.remove(id, userId, userRole);
  }
}
