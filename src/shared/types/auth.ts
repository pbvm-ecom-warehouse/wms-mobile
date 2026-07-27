export enum WmsRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEIVER = 'RECEIVER',
  PICKER = 'PICKER',
  PRINTER = 'PRINTER',
  COUNTER = 'COUNTER',
  SHIPPER = 'SHIPPER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: WmsRole;
  avatar?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
