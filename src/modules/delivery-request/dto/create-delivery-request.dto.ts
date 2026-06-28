import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ItemDto } from './item.dto';
import { RouteDto } from './route.dto';

export const ALLOWED_FULFILLMENT_MODES = [
  'open_marketplace',
  'recommended_provider',
  'search_provider',
] as const;

export const ALLOWED_DELIVERY_TYPES = [
  'agency_pickup',
  'document_delivery',
  'product_delivery',
  'purchase_delivery',
  'business_delivery',
  'other',
] as const;

export class CreateDeliveryRequestDto {
  @ApiProperty({ description: 'UUID of an existing CustomerContact.' })
  @IsUUID()
  customerContactId: string;

  @ApiPropertyOptional({
    enum: ALLOWED_FULFILLMENT_MODES,
    default: 'open_marketplace',
    description: 'Defaults to open_marketplace when omitted.',
  })
  @IsOptional()
  @IsIn(ALLOWED_FULFILLMENT_MODES)
  fulfillmentMode?: string;

  @ApiProperty({ enum: ALLOWED_DELIVERY_TYPES })
  @IsIn(ALLOWED_DELIVERY_TYPES)
  deliveryType: string;

  @ApiPropertyOptional({ example: '2026-06-25', description: 'ISO date string. Must not be in the past.' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Desired reward in XAF. Meaningful for open_marketplace only.' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  desiredRewardAmount?: number;

  @ApiPropertyOptional({ description: 'UUID of a ProviderProfile. Required when fulfillmentMode = search_provider.' })
  @IsOptional()
  @IsUUID()
  selectedProviderProfileId?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => RouteDto)
  route: RouteDto;

  @ApiProperty({ type: [ItemDto], description: 'At least one item required.' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
