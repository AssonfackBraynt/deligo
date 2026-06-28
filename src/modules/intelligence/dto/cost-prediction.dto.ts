import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum IntelligenceItemType {
  Document = 'document',
  Parcel = 'parcel',
  Food = 'food',
  Electronics = 'electronics',
  Business = 'business',
  Other = 'other',
}

export class ProviderRateInputDto {
  @IsNumber()
  @Min(0)
  baseFee: number;

  @IsNumber()
  @Min(0)
  pricePerKm: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fragileItemFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
}

export class HistoricalDeliveryInputDto {
  @IsNumber()
  @Min(0)
  distanceKm: number;

  @IsNumber()
  @Min(0)
  finalPrice: number;

  @IsEnum(IntelligenceItemType)
  itemType: IntelligenceItemType;
}

export class PredictDeliveryCostDto {
  @IsNumber()
  @Min(0)
  distanceKm: number;

  @IsEnum(IntelligenceItemType)
  itemType: IntelligenceItemType;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  weightKg?: number;

  @IsBoolean()
  @IsOptional()
  fragile?: boolean;

  @IsString()
  @IsOptional()
  currency?: string;

  @ValidateNested()
  @Type(() => ProviderRateInputDto)
  @IsOptional()
  providerRate?: ProviderRateInputDto;

  @ValidateNested({ each: true })
  @Type(() => HistoricalDeliveryInputDto)
  @IsOptional()
  historicalDeliveries?: HistoricalDeliveryInputDto[];
}
