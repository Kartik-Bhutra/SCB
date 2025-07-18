CREATE DATABASE IF NOT EXISTS SCB;

USE SCB;

CREATE TABLE IF NOT EXISTS blockedNo(
  id SMALLINT AUTO_INCREMENT PRIMARY KEY,
  mobileNoHashed VARCHAR(50) UNIQUE NOT NULL,
  mobileNoEncrypted VARCHAR(75) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports(
  reportedMobileNoHashed VARCHAR(100) PRIMARY KEY,
  reportedmobileNoEncrypted VARCHAR(100) NOT NULL,
  reporterMobileNoHashed varchar(100),
  STATUS ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporterMobileNo FOREIGN KEY (reporterMobileNoHashed) REFERENCES users (mobileNoHashed) ON DELETE CASCADE ON UPDATE CASCADE -- admin is also a client
);

CREATE TABLE IF NOT EXISTS blockedSeq(
  blockedSeq VARCHAR(10) PRIMARY KEY CHECK(blockedSeq REGEXP '^\\+[0-9]+$'),
  remark VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);