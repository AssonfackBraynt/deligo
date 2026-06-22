import { IsBoolean, IsString, MaxLength, MinLength, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AbandonDeliveryDto {
  @ApiProperty({ description: 'Provider must explicitly agree to the liability terms. Must be true.' })
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the liability terms before abandoning this delivery.' })
  agreedToTerms: boolean;

  @ApiProperty({ description: 'Reason for abandoning the delivery (10–500 characters).' })
  @IsString()
  @MinLength(10, { message: 'Please provide a detailed reason (at least 10 characters).' })
  @MaxLength(500)
  reason: string;
}
