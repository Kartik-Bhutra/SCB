export const DB_PASS = process.env.DB_PASS;
export const REDIS_PASS = process.env.REDIS_PASS;
export const REDIS_HOST = process.env.REDIS_HOST;
export const DB_NAME = process.env.DB_NAME;
export const DB_USER = process.env.DB_USER;
export const ENC_KEY = Buffer.from(process.env.ENC_KEY || "", "utf8");
export const HASH_KEY = process.env.HASH_KEY || "";
export const DB_HOST = process.env.DB_HOST;