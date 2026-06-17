import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@common/enums/account-status.enum';
import { RoleCode } from '@common/enums/role-code.enum';

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ enum: AccountStatus })
  accountStatus: AccountStatus;

  @ApiProperty({ enum: RoleCode, isArray: true })
  roles: RoleCode[];

  @ApiProperty({ type: [String] })
  agencyIds: string[];
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;
}
