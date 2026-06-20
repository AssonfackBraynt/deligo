export type AuthUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  accountStatus: string;
  roles: string[];
  agencyIds: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};
