import { AccountStatus } from '../enums/account-status.enum';
import { RoleCode } from '../enums/role-code.enum';

export type AuthenticatedUser = {
  id: string;
  phone: string;
  email?: string | null;
  accountStatus: AccountStatus;
  roles: RoleCode[];
  agencyIds: string[];
};
