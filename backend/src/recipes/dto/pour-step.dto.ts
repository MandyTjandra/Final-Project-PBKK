import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PourStepDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  startTimeSeconds!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waterAmountMl!: number;

  @IsString()
  @IsNotEmpty()
  instruction!: string;
}
