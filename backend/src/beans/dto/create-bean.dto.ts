import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessMethod, RoastLevel } from '../../common/enums/coffee.enum.js';

export class CreateBeanDto {
  @IsString()
  @IsNotEmpty({ message: 'Bean name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Origin is required' })
  origin!: string;

  @IsString()
  @IsOptional()
  farmOrStation?: string;

  @IsString()
  @IsNotEmpty({ message: 'Varietal is required' })
  varietal!: string;

  @IsEnum(ProcessMethod, { message: 'Invalid process method' })
  process!: ProcessMethod;

  @IsEnum(RoastLevel, { message: 'Invalid roast level' })
  roastLevel!: RoastLevel;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  altitudeMasl?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockGrams!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

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
  @IsNotEmpty({ message: 'Tasting notes are required' })
  tastingNotes!: string;
}
