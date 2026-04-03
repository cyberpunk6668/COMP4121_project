CREATE DATABASE IF NOT EXISTS `repair_platform`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `repair_platform`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(32) NOT NULL,
  `nickname` VARCHAR(120) NOT NULL,
  `role` ENUM('customer', 'engineer', 'admin') NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'disabled') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `engineers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `realName` VARCHAR(120) NOT NULL,
  `skillDesc` TEXT NOT NULL,
  `serviceArea` VARCHAR(255) NOT NULL,
  `avgRating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  `totalOrders` INT NOT NULL DEFAULT 0,
  `status` INT NOT NULL DEFAULT 0,
  `avatar` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_engineers_userId` (`userId`),
  CONSTRAINT `fk_engineers_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
