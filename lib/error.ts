export class CustomError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON() {
    return {
      error: true,
      message: this.message,
      code: this.code,
    };
  }
}
