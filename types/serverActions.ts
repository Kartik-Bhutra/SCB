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

export type requestClient = {
  username: string;
  mobileNo: string;
  deviceId: string;
};

export type checkAuthClient = {
  authenticated: boolean;
  deviceIdHashed: string;
};

export type clientDevice = {
  deviceId: string;
};
export type authClient = {
  username: string;
  mobileNo: string;
  authenticated: boolean;
};

export type changeClient = {
  mobileNo: string;
  newValue: string;
};
