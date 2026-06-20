import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { RoleCode } from '@common/enums/role-code.enum';

// Accepts: 698546321 · 237698546321 · +237698546321
const CAMEROON_PHONE_REGEX = /^(\+?237)?[2-9]\d{8}$/;
const CAMEROON_PHONE_MSG = 'Enter a valid Cameroon number (e.g. 698 546 321 or +237698546321)';

export class RegisterDto {
  @ApiProperty({ example: 'John Carrier' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '698000000' })
  @Matches(CAMEROON_PHONE_REGEX, { message: CAMEROON_PHONE_MSG })
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [RoleCode.Provider] })
  @IsIn([RoleCode.Provider])
  role: RoleCode.Provider;
}
