import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessMethod, RoastLevel } from '../../common/enums/coffee.enum.js';

export class UpdateBeanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  farmOrStation?: string;

  @IsString()
  @IsOptional()
  varietal?: string;

  @IsEnum(ProcessMethod)
  @IsOptional()
  process?: ProcessMethod;

  @IsEnum(RoastLevel)
  @IsOptional()
  roastLevel?: RoastLevel;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  altitudeMasl?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stockGrams?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  bagSizeGrams?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  tastingWheelUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  tastingNotes?: string;
}
