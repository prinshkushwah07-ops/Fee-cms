-- =======================================================
-- Nexvora Fee Management System - MySQL Database Schema
-- Database Name: fee-management
-- =======================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS `fee-management`;
USE `fee-management`;

-- Temporarily disable foreign key constraints during table drop and recreation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS `fee_payments`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `users`;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE (Single Login System)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ACADEMIC SESSIONS TABLE
CREATE TABLE `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_name` VARCHAR(50) UNIQUE NOT NULL,
  `is_active` TINYINT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDENTS DIRECTORY TABLE
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admission_number` VARCHAR(100) UNIQUE NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `father_name` VARCHAR(255) NOT NULL,
  `mother_name` VARCHAR(255) NOT NULL,
  `mobile_number` VARCHAR(15) NOT NULL,
  `address` TEXT NOT NULL,
  `class` VARCHAR(50) NOT NULL,
  `section` VARCHAR(10) NOT NULL,
  `session_year` VARCHAR(50) NOT NULL,
  `admission_date` DATE NOT NULL,
  `monthly_fee` DOUBLE NOT NULL DEFAULT 2000,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. FEE PAYMENT RECEIPTS TABLE
CREATE TABLE `fee_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_number` VARCHAR(100) UNIQUE NOT NULL,
  `student_id` INT NOT NULL,
  `session_id` INT NOT NULL,
  `fee_month` VARCHAR(255) NOT NULL,
  `number_of_months` INT NOT NULL,
  `monthly_fee` DOUBLE NOT NULL,
  `total_fee` DOUBLE NOT NULL,
  `paid_amount` DOUBLE NOT NULL,
  `pending_amount` DOUBLE NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL,
  `payment_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fee_payments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fee_payments_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- INDEXES CONFIGURATION
-- =======================================================
CREATE INDEX `idx_students_admission` ON `students` (`admission_number`);
CREATE INDEX `idx_fee_payments_student` ON `fee_payments` (`student_id`);
CREATE INDEX `idx_fee_payments_session` ON `fee_payments` (`session_id`);
CREATE INDEX `idx_fee_payments_receipt` ON `fee_payments` (`receipt_number`);
CREATE INDEX `idx_fee_payments_date` ON `fee_payments` (`payment_date`);
CREATE INDEX `idx_fee_payments_month` ON `fee_payments` (`fee_month`);

-- =======================================================
-- SEED DATA INITIALIZATION
-- =======================================================

-- Seed User Login Credentials
INSERT INTO `users` (`username`, `password`) VALUES ('admin', 'admin123');

-- Seed Sessions
INSERT INTO `sessions` (`session_name`, `is_active`) VALUES 
('2025-26', 0),
('2026-27', 1),
('2027-28', 0);

-- Seed Students
INSERT INTO `students` (`id`, `admission_number`, `student_name`, `father_name`, `mother_name`, `mobile_number`, `address`, `class`, `section`, `session_year`, `admission_date`) VALUES 
(1, 'ADM2026001', 'Rahul Sharma', 'Ramesh Sharma', 'Sunita Sharma', '9876543210', '123, Sector 15, Vasundhara, Ghaziabad', 'Class 10', 'A', '2026-27', '2026-04-01'),
(2, 'ADM2026002', 'Priya Patel', 'Sanjay Patel', 'Meena Patel', '9812345678', '45, Navrangpura, Ahmedabad, Gujarat', 'Class 12', 'B', '2026-27', '2026-04-02'),
(3, 'ADM2026003', 'Amit Kumar', 'Rajender Prasad', 'Kamla Devi', '9988776655', 'H.No 24, Gali No 3, Laxmi Nagar, Delhi', 'Class 10', 'A', '2026-27', '2026-04-03'),
(4, 'ADM2026004', 'Siddharth Singh', 'Mahendra Singh', 'Radha Singh', '8877665544', 'Flat 402, Royal Residency, Indirapuram', 'Class 11', 'C', '2026-27', '2026-04-05'),
(5, 'ADM2026005', 'Ananya Roy', 'Bikram Roy', 'Srabanti Roy', '9432109876', '12/A, Ballygunge Circular Road, Kolkata', 'Class 9', 'B', '2026-27', '2026-04-08'),
(6, 'ADM2026006', 'Vikram Rathore', 'Kalyan Singh Rathore', 'Urmila Rathore', '7766554433', 'Plot 89, Vaishali Nagar, Jaipur, Rajasthan', 'Class 12', 'A', '2026-27', '2026-04-10'),
(7, 'ADM2026007', 'Neha Gupta', 'Alok Gupta', 'Reena Gupta', '9560123456', '56, Gomti Nagar, Lucknow, Uttar Pradesh', 'Class 8', 'A', '2026-27', '2026-04-12'),
(8, 'ADM2026008', 'Arjun Verma', 'Suresh Verma', 'Kiran Verma', '9911223344', 'Flat 101, Sky High Apts, HSR Layout, Bangalore', 'Class 11', 'B', '2026-27', '2026-04-15'),
(9, 'ADM2026009', 'Sneha Reddy', 'Venkat Reddy', 'Lakshmi Reddy', '8899001122', 'Plot 304, Jubilee Hills, Hyderabad', 'Class 12', 'C', '2026-27', '2026-04-18'),
(10, 'ADM2026010', 'Rohan Das', 'Pranab Das', 'Mithu Das', '9007012345', '34/1, Salt Lake Sector 2, Kolkata', 'Class 10', 'B', '2025-26', '2025-05-10');

-- Seed Payments
INSERT INTO `fee_payments` (`receipt_number`, `student_id`, `session_id`, `fee_month`, `number_of_months`, `monthly_fee`, `total_fee`, `paid_amount`, `pending_amount`, `payment_mode`, `payment_date`) VALUES 
('REC-10001', 1, 2, 'April,May,June', 3, 2000, 6000, 6000, 0, 'UPI', '2026-06-05'),
('REC-10002', 2, 2, 'April,May', 2, 2500, 5000, 5000, 0, 'UPI', '2026-05-10'),
('REC-10003', 3, 2, 'April,May,June,July', 4, 2000, 8000, 7000, 1000, 'Cash', '2026-07-12'),
('REC-10004', 4, 2, 'April', 1, 2200, 2200, 2200, 0, 'Cash', '2026-04-10'),
('REC-10005', 5, 2, 'April,May,June', 3, 1800, 5400, 5400, 0, 'UPI', '2026-06-15'),
('REC-10006', 6, 2, 'April,May', 2, 2500, 5000, 4000, 1000, 'Cash', '2026-05-20'),
('REC-10007', 7, 2, 'April,May,June,July,August', 5, 1500, 7500, 7500, 0, 'UPI', '2026-08-17'),
('REC-10008', 10, 1, 'April,May,June,July,August,September,October,November,December,January,February,March', 12, 1800, 21600, 21600, 0, 'UPI', '2026-03-10');
