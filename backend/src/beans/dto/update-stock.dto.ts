import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt({ message: 'Stock must be an integer in grams' })
  @Min(0, { message: 'Stock cannot be negative' })
  stockGrams!: number;
}
