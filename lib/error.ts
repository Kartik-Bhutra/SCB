export class CustomError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
    this.code = code;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
    };
  }
}
