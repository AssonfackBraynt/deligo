import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProviderCandidateDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  distanceKm: number;

  @IsNumber()
  @Min(0)
  estimatedPrice: number;

  @IsBoolean()
  available: boolean;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  verificationLevel: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  completionRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;
}

export class RecommendProvidersDto {
  @ValidateNested({ each: true })
  @Type(() => ProviderCandidateDto)
  providers: ProviderCandidateDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDistanceKm?: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}
