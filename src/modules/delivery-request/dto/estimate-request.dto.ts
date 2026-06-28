import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ItemDto } from './item.dto';

export class EstimateRequestDto {
  @ApiProperty()
  @IsUUID()
  pickupQuarterId: string;

  @ApiProperty()
  @IsUUID()
  destinationQuarterId: string;

  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
