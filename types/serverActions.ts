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
