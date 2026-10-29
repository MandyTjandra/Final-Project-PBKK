import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BrewMethod, Difficulty } from '../../common/enums/coffee.enum.js';
import { PourStepDto } from './pour-step.dto.js';

export class CreateRecipeDto {
  @IsString()
  @IsOptional()
  coffeeBeanId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Recipe title is required' })
  title!: string;

  @IsEnum(BrewMethod, { message: 'Invalid brew method' })
  method!: BrewMethod;

  @IsString()
  @IsNotEmpty({ message: 'Grind size is required' })
  grindSize!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Coffee dose must be at least 1 gram' })
  coffeeDoseGrams!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Target ratio must be at least 1' })
  targetRatio!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalWaterMl!: number;

  @Type(() => Number)
  @IsInt()
  @Min(50)
  waterTempCelsius!: number;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  totalBrewTimeSeconds!: number;

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
  pourSteps!: PourStepDto[];
}
