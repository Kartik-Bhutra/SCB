export interface clientToken {
  token: string;
}

export interface clientOTP extends clientToken {
  otp: string;
}

export interface registerClientToken {
  username: string;
  mobileNo: string;
  deviceId: string;
}

export type currentAdminDBResponse = {
  role: boolean;
};

export type loginAdminDBResponse = {
  passwordHashed: string;
};

export type LoginState = {
  success: boolean;
  error: string;
};
