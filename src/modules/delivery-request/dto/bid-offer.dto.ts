import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class BidOfferDto {
  @ApiProperty({ example: 3500, description: 'Your bid amount in XAF.' })
  @IsNumber()
  @IsPositive()
  offerAmount: number;

  @ApiPropertyOptional({ example: 'I can pick up within 30 minutes.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
