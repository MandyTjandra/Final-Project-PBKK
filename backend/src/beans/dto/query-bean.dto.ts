import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessMethod, RoastLevel } from '../../common/enums/coffee.enum.js';

export class QueryBeanDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(RoastLevel)
  @IsOptional()
  roastLevel?: RoastLevel;

  @IsEnum(ProcessMethod)
  @IsOptional()
  process?: ProcessMethod;

  @IsString()
  @IsOptional()
  origin?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
