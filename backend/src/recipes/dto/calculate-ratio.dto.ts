import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BrewMethod } from '../../common/enums/coffee.enum.js';

export class CalculateRatioDto {
  @Type(() => Number)
  @IsNumber()
  @Min(5, { message: 'Coffee dose must be at least 5 grams' })
  coffeeDoseGrams!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(5, { message: 'Target ratio must be at least 5' })
  @IsOptional()
  targetRatio?: number;

  @IsEnum(BrewMethod, { message: 'Invalid brew method' })
  method!: BrewMethod;
}
