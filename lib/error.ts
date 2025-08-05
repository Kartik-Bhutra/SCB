export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON() {
    return {
      error: this.message,
    };
  }
}
