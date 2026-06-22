import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelDeliveryDto {
  @ApiPropertyOptional({ description: 'Optional reason for cancellation.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
