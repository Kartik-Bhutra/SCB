CREATE DATABASE IF NOT EXISTS SCB;

USE SCB;

CREATE TABLE IF NOT EXISTS users (
  mobileNoHashed VARCHAR(100) PRIMARY KEY,
  mobileNoEncrypted VARCHAR(100) NOT NULL,
  deviceIdHashed VARCHAR(100) UNIQUE,
  -- can be NULL as for admins
  username VARCHAR(30) NOT NULL,
  -- for clients, and reference for admins
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  userId VARCHAR(30) PRIMARY KEY,
  passwordHashed VARCHAR(100) NOT NULL,
  mobileNoHashed VARCHAR(100),
  role BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_mobileNo FOREIGN KEY (mobileNoHashed) REFERENCES users (mobileNoHashed) ON DELETE CASCADE ON UPDATE CASCADE -- admin is also a client
);

CREATE TABLE IF NOT EXISTS requests(
  deviceIdHashed VARCHAR(100) PRIMARY KEY,
  -- for seaching deviceId should be primary key
  mobileNoEncrypted VARCHAR(100) NOT NULL,
  username varchar(30) NOT NULL,
  -- if apporved then added to users and deleted from here
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);