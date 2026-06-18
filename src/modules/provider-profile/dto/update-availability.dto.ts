import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: AvailabilityStatus })
  @IsEnum(AvailabilityStatus)
  availabilityStatus: AvailabilityStatus;
}
