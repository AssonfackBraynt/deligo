import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { LocationPointDto } from './route-matching.dto';

export class DispatchRiderDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsBoolean()
  available: boolean;

  @IsNumber()
  @Min(0)
  currentWorkload: number;

  @ValidateNested()
  @Type(() => LocationPointDto)
  currentLocation: LocationPointDto;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  verificationLevel?: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;
}

export class DispatchRequestDto {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => LocationPointDto)
  pickup: LocationPointDto;

  @ValidateNested()
  @Type(() => LocationPointDto)
  destination: LocationPointDto;
}

export class SmartDispatchDto {
  @ValidateNested()
  @Type(() => DispatchRequestDto)
  request: DispatchRequestDto;

  @ValidateNested({ each: true })
  @Type(() => DispatchRiderDto)
  riders: DispatchRiderDto[];

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;
}
