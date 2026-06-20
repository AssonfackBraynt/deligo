import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ITEM_CATEGORIES = [
  'document', 'electronics', 'clothing', 'food',
  'medical', 'fragile', 'vehicle_parts', 'furniture', 'other',
];

export const SIZE_LABELS = ['small', 'medium', 'large', 'oversized'];

export class ItemDto {
  @ApiProperty({ example: 'Samsung phone' })
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  itemName: string;

  @ApiPropertyOptional({ example: 'Galaxy S24, in original box' })
  @IsOptional()
  @IsString()
  itemDescription?: string;

  @ApiPropertyOptional({ example: 'electronics', enum: ITEM_CATEGORIES })
  @IsOptional()
  @IsIn(ITEM_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 'small', enum: SIZE_LABELS })
  @IsOptional()
  @IsIn(SIZE_LABELS)
  sizeLabel?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional({ example: 'Handle with care — do not flip' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;
}
