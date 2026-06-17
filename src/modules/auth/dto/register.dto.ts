import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { RoleCode } from '@common/enums/role-code.enum';

export class RegisterDto {
  @ApiProperty({ example: 'John Carrier' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '+237600000000' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [RoleCode.Carrier, RoleCode.ProviderAdmin, RoleCode.AgencyAdmin] })
  @IsIn([RoleCode.Carrier, RoleCode.ProviderAdmin, RoleCode.AgencyAdmin])
  role: RoleCode.Carrier | RoleCode.ProviderAdmin | RoleCode.AgencyAdmin;
}
