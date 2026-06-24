import { ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus, ProviderType, VerificationStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListProvidersQueryDto {
  @ApiPropertyOptional({ enum: ProviderType })
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @ApiPropertyOptional({ example: 'Douala', description: 'Case-insensitive partial match on baseCity.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  baseCity?: string;

  @ApiPropertyOptional({ example: 'Express', description: 'Case-insensitive search across displayName and baseCity.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availabilityStatus?: AvailabilityStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
