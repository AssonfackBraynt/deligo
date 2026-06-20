import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Accepts: 698546321 · 237698546321 · +237698546321
const CAMEROON_PHONE_REGEX = /^(\+?237)?[2-9]\d{8}$/;
const CAMEROON_PHONE_MSG = 'Enter a valid Cameroon number (e.g. 698 546 321 or +237698546321)';

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'Jean Paul Mbarga' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    example: '698546321',
    description: 'Primary phone number. Can differ from whatsappNumber.',
  })
  @IsOptional()
  @Matches(CAMEROON_PHONE_REGEX, { message: CAMEROON_PHONE_MSG })
  phone?: string;

  @ApiProperty({
    example: '698546321',
    description: 'WhatsApp number. Local (698546321) or international (+237698546321). Required.',
  })
  @Matches(CAMEROON_PHONE_REGEX, { message: CAMEROON_PHONE_MSG })
  whatsappNumber: string;

  @ApiPropertyOptional({
    example: '670000001',
    description:
      'Mobile money number (MTN MoMo / Orange Money). ' +
      'Defaults to whatsappNumber when omitted.',
  })
  @IsOptional()
  @Matches(CAMEROON_PHONE_REGEX, { message: CAMEROON_PHONE_MSG })
  paymentNumber?: string;

  @ApiPropertyOptional({ example: 'jeanpaul@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'fr', default: 'en', description: 'ISO 639-1 language code.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  preferredLanguage?: string;
}
