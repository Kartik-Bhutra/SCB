export const DB_PASS = process.env.DB_PASS;
export const REDIS_PASS = process.env.REDIS_PASS;
export const DB_NAME = process.env.DB_NAME;
export const ENC_KEY = Buffer.from(process.env.ENC_KEY || "", "utf8");
export const HASH_KEY = process.env.HASH_KEY || "";
