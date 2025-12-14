import { createClient, RedisClientOptions } from "redis";
import { createPool, PoolOptions } from "mysql2/promise";
import { platform } from "os";
import { DB_NAME, DB_PASS, REDIS_PASS } from "../../env";

const os = platform();

const dbConfig: PoolOptions = {
  user: "root",
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

if (os === "linux") {
  dbConfig.socketPath = "/var/run/mysqld/mysqld.sock";
} else if (os === "darwin") {
  dbConfig.socketPath = "/tmp/mysql.sock";
} else {
  dbConfig.host = "127.0.0.1";
  dbConfig.port = 3306;
}

export const pool = createPool(dbConfig);

let redisConfig: RedisClientOptions = {
  url: "redis://127.0.0.1:6379",
  username: "default",
  password: REDIS_PASS,
};

if (os === "linux") {
  redisConfig.socket = {
    path: "/var/run/redis/redis.sock",
    tls: false,
  };
}

export const client = await createClient(redisConfig).connect();
