CREATE DATABASE IF NOT EXISTS SCB;

USE SCB;

CREATE TABLE IF NOT EXISTS blockedNo(
  mobileNoHashed VARCHAR(100) PRIMARY KEY,
  mobileNoEncrypted VARCHAR(100) NOT NULL,
  remark VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports(
  reportedMobileNoHashed VARCHAR(100) PRIMARY KEY,
  reportedmobileNoEncrypted VARCHAR(100) NOT NULL,
  reporterMobileNoHashed varchar(100),
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporterMobileNo FOREIGN KEY (reporterMobileNoHashed) REFERENCES users (mobileNoHashed) ON DELETE CASCADE ON UPDATE CASCADE -- admin is also a client
);

CREATE TABLE IF NOT EXISTS blockedSeq(
  blockedSeq VARCHAR(10) PRIMARY KEY CHECK(blockedSeq REGEXP '^\\+[0-9]+$'),
  remark VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);