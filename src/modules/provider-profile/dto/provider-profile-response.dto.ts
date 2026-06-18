import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus, ProviderType, VerificationStatus } from '@prisma/client';

export class ProviderProfilePublicDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ProviderType }) providerType: string;
  @ApiProperty() displayName: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional({ description: 'independent_rider only' }) baseCity?: string | null;
  @ApiPropertyOptional() baseCountry?: string | null;
  @ApiPropertyOptional({ description: 'independent_rider only' }) serviceCoverage?: string | null;
  @ApiPropertyOptional({ description: 'courier_company and logistics_company only' }) businessAddress?: string | null;
  @ApiPropertyOptional({ description: 'Company types only. Never returned for independent_rider.' }) businessLat?: number | null;
  @ApiPropertyOptional({ description: 'Company types only. Never returned for independent_rider.' }) businessLng?: number | null;
  @ApiProperty() ratingAverage: number;
  @ApiProperty() ratingCount: number;
  @ApiProperty({ enum: VerificationStatus }) verificationStatus: string;
  @ApiProperty({ enum: AvailabilityStatus }) availabilityStatus: string;
  @ApiProperty() isFeatured: boolean;
  @ApiPropertyOptional({ description: 'Only present when verificationStatus is verified.' }) phoneNumber?: string | null;
}

export class ProviderProfilePrivateDto extends ProviderProfilePublicDto {
  @ApiPropertyOptional() userId?: string | null;
  @ApiPropertyOptional() agencyId?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
