import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CounterOfferDto {
  @ApiProperty({ example: 2500, description: 'Counter-offer amount in XAF.' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'Can you do 2500 FCFA?', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
