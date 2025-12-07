import { createPool, PoolOptions } from "mysql2/promise";
import { platform } from "os";

const os = platform();

const dbConfig: PoolOptions = {
  user: "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "test",
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