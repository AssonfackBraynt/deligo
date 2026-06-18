import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const COMPANY_TYPES: ProviderType[] = [ProviderType.courier_company, ProviderType.logistics_company];

export class CreateProviderProfileDto {
  @ApiProperty({ enum: ProviderType, example: ProviderType.independent_rider })
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @ApiProperty({ example: 'Express Riders Douala' })
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  displayName: string;

  @ApiPropertyOptional({ example: 'Fast and reliable same-day delivery across Douala.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '+237612345678' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Cameroon', default: 'Cameroon' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  baseCountry?: string;

  // ── independent_rider only ────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'Douala' })
  @ValidateIf((o) => o.providerType === ProviderType.independent_rider)
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  baseCity?: string;

  @ApiPropertyOptional({ example: 'Douala (Akwa, Bonanjo, Bali), Yaounde (Bastos, Melen)' })
  @ValidateIf((o) => o.providerType === ProviderType.independent_rider)
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  serviceCoverage?: string;

  // ── courier_company / logistics_company only ──────────────────────────────

  @ApiPropertyOptional({ example: '14 Rue du Commerce, Akwa, Douala' })
  @ValidateIf((o) => COMPANY_TYPES.includes(o.providerType))
  @IsNotEmpty()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 4.0511, description: 'Latitude −90 to 90. Company types only.' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  businessLat?: number;

  @ApiPropertyOptional({ example: 9.7679, description: 'Longitude −180 to 180. Company types only.' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  businessLng?: number;
}
