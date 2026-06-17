import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class LocationPointDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CarrierRouteInputDto {
  @IsString()
  id: string;

  @IsString()
  carrierId: string;

  @ValidateNested()
  @Type(() => LocationPointDto)
  origin: LocationPointDto;

  @ValidateNested()
  @Type(() => LocationPointDto)
  destination: LocationPointDto;

  @IsNumber()
  @Min(0)
  preferredRadiusKm: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scheduleDays?: string[];
}

export class ActiveRequestInputDto {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => LocationPointDto)
  pickup: LocationPointDto;

  @ValidateNested()
  @Type(() => LocationPointDto)
  destination: LocationPointDto;

  @IsString()
  @IsOptional()
  expectedDay?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rewardAmount?: number;
}

export class MatchRoutesDto {
  @ValidateNested({ each: true })
  @Type(() => CarrierRouteInputDto)
  carrierRoutes: CarrierRouteInputDto[];

  @ValidateNested({ each: true })
  @Type(() => ActiveRequestInputDto)
  activeRequests: ActiveRequestInputDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumScore?: number;
}
