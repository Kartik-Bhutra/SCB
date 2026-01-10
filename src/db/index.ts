import { createPool, type PoolOptions } from "mysql2/promise";
import { createClient, type RedisClientOptions } from "redis";
import { DB_HOST, DB_NAME, DB_PASS, REDIS_HOST } from "../env";

// import { platform } from "os";

// const os = platform();

// const dbConfig: PoolOptions = {
//   user: "root",
//   password: DB_PASS,
//   database: DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   maxIdle: 10,
//   idleTimeout: 60000,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// };

const dbConfig: PoolOptions = {
  host: DB_HOST,
  port: 3306,
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

// if (os === "linux") {
//   dbConfig.socketPath = "/var/run/mysqld/mysqld.sock";
// } else if (os === "darwin") {
//   dbConfig.socketPath = "/tmp/mysql.sock";
// } else {
//   dbConfig.host = "localhost";
//   dbConfig.port = 3306;
// }

export const pool = createPool(dbConfig);

// let redisConfig: RedisClientOptions = {
//   url: "redis://127.0.0.1:6379",
//   username: "default",
//   password: REDIS_PASS,
// };

// if (os === "linux") {
//   redisConfig.socket = {
//     path: "/var/run/redis/redis.sock",
//     tls: false,
//   };
// }

const redisConfig: RedisClientOptions = {
  socket: {
    host: REDIS_HOST,
    port: 6379,
  },
};

export const client = await createClient(redisConfig).connect();
