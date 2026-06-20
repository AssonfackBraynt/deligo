import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRiderDto {
  @ApiProperty({ description: 'UUID of the Rider to assign to this request.' })
  @IsUUID()
  riderId: string;
}
