import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BrewMethod, Difficulty } from '../../common/enums/coffee.enum.js';

export class QueryRecipeDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(BrewMethod)
  @IsOptional()
  method?: BrewMethod;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  coffeeBeanId?: string;

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
