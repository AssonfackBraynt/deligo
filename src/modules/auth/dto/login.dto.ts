import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

// Accepts: 698546321 · 237698546321 · +237698546321
const CAMEROON_PHONE_REGEX = /^(\+?237)?[2-9]\d{8}$/;
const CAMEROON_PHONE_MSG = 'Enter a valid Cameroon number (e.g. 698 546 321 or +237698546321)';

export class LoginDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '698000000' })
  @IsOptional()
  @Matches(CAMEROON_PHONE_REGEX, { message: CAMEROON_PHONE_MSG })
  phone?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
