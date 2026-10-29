import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BrewMethod, Difficulty } from '../../common/enums/coffee.enum.js';
import { PourStepDto } from './pour-step.dto.js';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  coffeeBeanId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(BrewMethod)
  @IsOptional()
  method?: BrewMethod;

  @IsString()
  @IsOptional()
  grindSize?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  coffeeDoseGrams?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  targetRatio?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalWaterMl?: number;

  @Type(() => Number)
  @IsInt()
  @Min(50)
  @IsOptional()
  waterTempCelsius?: number;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @IsOptional()
  totalBrewTimeSeconds?: number;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PourStepDto)
  @IsOptional()
  pourSteps?: PourStepDto[];
}
