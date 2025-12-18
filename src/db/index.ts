import { createClient, RedisClientOptions } from "redis";
import { createPool, PoolOptions } from "mysql2/promise";
import { DB_HOST, DB_NAME, DB_PASS, DB_USER, REDIS_HOST, REDIS_PASS } from "../../env";


const dbConfig: PoolOptions = {
  host: DB_HOST,
  port: 3306,
  user: DB_USER || "user",
  password: DB_PASS,
  database: DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
};

export const pool = createPool(dbConfig);


const redisConfig: RedisClientOptions = {
  socket: {
    host: REDIS_HOST,
    port: 6379,
  },
  username: "default",
  password: REDIS_PASS || undefined,
};

export const client = await createClient(redisConfig).connect();
