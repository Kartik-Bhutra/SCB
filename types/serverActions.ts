export interface clientToken {
  token: string;
}

export interface clientOTP extends clientToken {
  otp: string;
}

export interface authenticatedClient {
  authenticated: boolean;
}

export interface registerClientToken {
  username: string;
  mobileNo: string;
  deviceId: string;
}

export interface mergedClient
  extends registerClientToken,
    authenticatedClient {}

export interface adminDB {
  passwordHashed: string;
  role: boolean;
}

export interface adminStat {
  userId: string;
  role: boolean;
}

export interface LoginState {
  success: boolean;
  error: string;
}
