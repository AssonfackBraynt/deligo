import { AccountStatus } from '../enums/account-status.enum';
import { RoleCode } from '../enums/role-code.enum';

export type JwtPayload = {
  sub: string;
  phone: string;
  email?: string | null;
  accountStatus: AccountStatus;
  roles: RoleCode[];
  agencyIds: string[];
};
