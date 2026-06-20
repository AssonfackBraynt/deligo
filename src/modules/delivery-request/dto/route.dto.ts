import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class RouteDto {
  @ApiProperty({ example: 'uuid-of-bonamoussadi-quarter' })
  @IsUUID()
  pickupQuarterId: string;

  @ApiProperty({ example: 'Opposite Total Bonamoussadi' })
  @IsString()
  @MinLength(2)
  pickupLandmark: string;

  @ApiPropertyOptional({ example: 4.0483 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat?: number;

  @ApiPropertyOptional({ example: 9.7043 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng?: number;

  @ApiProperty({ example: 'uuid-of-akwa-quarter' })
  @IsUUID()
  destinationQuarterId: string;

  @ApiProperty({ example: 'Near Carrefour Akwa' })
  @IsString()
  @MinLength(2)
  destinationLandmark: string;

  @ApiPropertyOptional({ example: 3.8667 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLat?: number;

  @ApiPropertyOptional({ example: 11.5167 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLng?: number;
}
