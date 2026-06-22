import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRiderRouteDto {
  @ApiProperty({ description: 'Quarter ID where the rider starts their journey' })
  @IsUUID()
  originQuarterId: string;

  @ApiProperty({ description: 'Quarter ID where the rider is heading' })
  @IsUUID()
  destinationQuarterId: string;

  @ApiPropertyOptional({ description: 'Planned departure time in HH:MM format (e.g. "10:30")' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Matches(/^\d{2}:\d{2}$/, { message: 'departureTime must be in HH:MM format' })
  departureTime?: string;

  @ApiPropertyOptional({ description: 'Whether this route repeats on set days' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Days this route repeats on. Values: mon|tue|wed|thu|fri|sat|sun',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recurringDays?: string[];
}
