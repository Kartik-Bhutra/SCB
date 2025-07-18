export interface clientToken {
  token: string;
}

export interface clientOTP extends clientToken {
  otp: string;
}

export interface authenticatedClient {
  authenticated: boolean;
}

export interface authToken extends clientToken, authenticatedClient {}

export interface registerClientToken {
  username: string;
  mobileNo: string;
}

export interface mergedClient
  extends registerClientToken,
    authenticatedClient {}

export interface adminDB {
  passwordHashed: string;
  role: boolean;
}

export interface session {
  role: boolean;
  sid: string;
}

export interface serverActionState {
  success: boolean;
  error: string;
}
export interface blockedData {
  mobileNoEncrypted: string;
  id: number;
  createdAt: Date;
}
