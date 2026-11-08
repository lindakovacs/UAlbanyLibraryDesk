-- =============================================================================
-- UAlbany LibraryDesk Database Schema & Seed Data
-- Database: ualbanylibrarydesk
-- Description: Equipment and Resource Management System for University at Albany Libraries
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `ualbanylibrarydesk` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `ualbanylibrarydesk`;

-- Disable foreign key checks during table setup
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: staff_users
-- Authorized library circulation staff credentials and workstation assignments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `netid` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `university_id` VARCHAR(20) NOT NULL,
  `department` VARCHAR(100) NOT NULL DEFAULT 'University Libraries',
  `division` VARCHAR(100) NOT NULL DEFAULT 'Access & Circulation Services',
  `email` VARCHAR(100) NOT NULL,
  `role` VARCHAR(100) NOT NULL DEFAULT 'Authorized Circulation Specialist',
  `desk_station` VARCHAR(100) NOT NULL DEFAULT 'Uptown Circulation Desk #2',
  `workstation_id` VARCHAR(50) NOT NULL DEFAULT 'DESK-CIRC-02 (Uptown)',
  `permissions` JSON NULL,
  `password_hash` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_staff_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: equipment
-- Catalog of University Library technology, consoles, and AV equipment
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
  `id` VARCHAR(20) NOT NULL PRIMARY KEY, -- e.g., 'EQ-001'
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `available_quantity` INT NOT NULL DEFAULT 1,
  `total_quantity` INT NOT NULL DEFAULT 1,
  `status` ENUM('available', 'low-stock', 'maintenance', 'retired') NOT NULL DEFAULT 'available',
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_equipment_category` (`category`),
  INDEX `idx_equipment_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: equipment_accessories
-- Kit accessories included with specific equipment items
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment_accessories`;
CREATE TABLE `equipment_accessories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipment_id` VARCHAR(20) NOT NULL,
  `accessory_name` VARCHAR(150) NOT NULL,
  CONSTRAINT `fk_accessory_equipment` FOREIGN KEY (`equipment_id`) 
    REFERENCES `equipment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: borrowers
-- Registered students, faculty, and staff eligible to borrow equipment
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `borrowers`;
CREATE TABLE `borrowers` (
  `netid` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `university_id` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `role` VARCHAR(100) NOT NULL DEFAULT 'Undergraduate Student',
  `open_loans` INT NOT NULL DEFAULT 0,
  `status` ENUM('good-standing', 'restricted', 'suspended') NOT NULL DEFAULT 'good-standing',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_borrower_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: loans
-- Equipment checkout, circulation status, due dates, and return records
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` VARCHAR(20) NOT NULL PRIMARY KEY, -- e.g., 'LN-1042'
  `equipment_id` VARCHAR(20) NOT NULL,
  `borrower_netid` VARCHAR(50) NOT NULL,
  `asset_tag` VARCHAR(50) NULL,
  `checkout_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATETIME NOT NULL,
  `return_date` DATETIME NULL,
  `status` ENUM('active', 'due-today', 'overdue', 'returned') NOT NULL DEFAULT 'active',
  `return_condition` VARCHAR(50) NULL,
  `destination` VARCHAR(50) NULL,
  `return_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_loans_status` (`status`),
  INDEX `idx_loans_due_date` (`due_date`),
  CONSTRAINT `fk_loans_equipment` FOREIGN KEY (`equipment_id`) 
    REFERENCES `equipment` (`id`),
  CONSTRAINT `fk_loans_borrower` FOREIGN KEY (`borrower_netid`) 
    REFERENCES `borrowers` (`netid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: preparation_items
-- Equipment in readiness pipeline (Details, Assignment, Sanitization, Review)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `preparation_items`;
CREATE TABLE `preparation_items` (
  `id` VARCHAR(20) NOT NULL PRIMARY KEY, -- e.g., 'PREP-001'
  `equipment_id` VARCHAR(20) NOT NULL,
  `equipment_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `assigned_staff` VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  `target_date` VARCHAR(50) NOT NULL,
  `status` ENUM('awaiting', 'in-prep', 'review', 'ready') NOT NULL DEFAULT 'awaiting',
  `current_step` INT NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_prep_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: preparation_checklist_items
-- Multi-step sanitization and inspection checklist items for preparation items
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `preparation_checklist_items`;
CREATE TABLE `preparation_checklist_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `preparation_id` VARCHAR(20) NOT NULL,
  `step_key` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  CONSTRAINT `fk_checklist_prep` FOREIGN KEY (`preparation_id`) 
    REFERENCES `preparation_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: report_metrics
-- Historical checkout aggregates and usage statistics for reporting
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `report_metrics`;
CREATE TABLE `report_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipment_id` VARCHAR(20) NOT NULL,
  `semester` VARCHAR(50) NOT NULL DEFAULT 'Fall 2026',
  `checkouts_count` INT NOT NULL DEFAULT 0,
  `avg_loan_days` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
  `total_days_out` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_report_equipment` FOREIGN KEY (`equipment_id`) 
    REFERENCES `equipment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA INSERTION
-- =============================================================================

-- Seed Staff User (Default password: password123)
INSERT INTO `staff_users` (`netid`, `name`, `university_id`, `department`, `division`, `email`, `role`, `desk_station`, `workstation_id`, `permissions`, `password_hash`, `status`)
VALUES (
  'linda.kovacs',
  'Linda Kovacs',
  '001239847',
  'University Libraries',
  'Access & Circulation Services',
  'linda.kovacs@ualbany.edu',
  'Authorized Circulation Specialist',
  'Uptown Circulation Desk #2',
  'DESK-CIRC-02 (Uptown)',
  '["checkout", "return", "review", "reports"]',
  '$2a$10$o1pf200kha5sZE6OD8OvxuGZ7DjbPICdKB2nNtIkWAW3OzJbGGFoq',
  'active'
) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `password_hash`=VALUES(`password_hash`);

-- Seed Equipment Catalog (13 items)
INSERT INTO `equipment` (`id`, `name`, `category`, `available_quantity`, `total_quantity`, `status`, `description`) VALUES
('EQ-001', 'Mirrorless Camera Kit', 'Creative Technology', 3, 4, 'available', 'Sony Alpha mirrorless 4K camera kit with 28-70mm lens, 64GB SD card, battery, and charger.'),
('EQ-002', 'Nintendo Switch', 'Gaming Consoles and Accessories', 3, 4, 'available', 'Nintendo Switch OLED console with Joy-Con pair, dock, power adapter, and HDMI cable.'),
('EQ-003', 'H4 Zoom Audio Recording Kit', 'Creative Technology', 2, 3, 'available', 'Handy portable 4-track audio recorder with X/Y stereo mics and XLR inputs.'),
('EQ-004', '3D Scanning Kit (Revopoint POP 3 Plus)', 'Creative Technology', 1, 2, 'available', 'High-precision handheld 3D scanner for modeling and digital reverse engineering.'),
('EQ-005', 'Rode Wireless GO II Microphone System', 'Creative Technology', 2, 3, 'available', 'Dual-channel compact wireless microphone system with built-in recording.'),
('EQ-006', 'PlayStation 5', 'Gaming Consoles and Accessories', 2, 3, 'available', 'Sony PS5 console with DualSense wireless controller, power cable, and HDMI cable.'),
('EQ-007', 'Arcade Controller', 'Gaming Consoles and Accessories', 2, 2, 'available', 'Universal 8-button arcade fight stick controller for tournament and casual play.'),
('EQ-008', 'H1 Zoom Kit', 'Creative Technology', 2, 2, 'available', 'Lightweight ultra-compact stereo audio recorder for field interviews and podcasting.'),
('EQ-009', 'M30 Gamepad', 'Gaming Consoles and Accessories', 3, 3, 'available', 'Classic 6-button wireless Bluetooth gamepad controller.'),
('EQ-010', 'Owl 3 Video Conference Camera', 'Creative Technology', 2, 2, 'available', '360-degree intelligent video camera, speaker, and microphone combo for hybrid group meetings.'),
('EQ-011', 'Portable Podcasting Kit (Zoom H6)', 'Creative Technology', 2, 2, 'available', '6-track flagship portable audio recorder with interchangeable microphone capsules.'),
('EQ-012', 'SmallRig All-in-One Smartphone Video Kit', 'Creative Technology', 2, 2, 'available', 'Complete smartphone mobile filmmaking rig with handles, LED fill light, and shotgun microphone.'),
('EQ-013', 'SN30 Pro Gamepad', 'Gaming Consoles and Accessories', 3, 3, 'available', 'Full-featured retro wireless Bluetooth controller with dual analog sticks and rumble vibration.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `available_quantity`=VALUES(`available_quantity`);

-- Seed Equipment Accessories
INSERT INTO `equipment_accessories` (`equipment_id`, `accessory_name`) VALUES
('EQ-001', 'Camera body'),
('EQ-001', '28-70mm lens'),
('EQ-001', '64GB SD card'),
('EQ-001', 'Rechargeable battery'),
('EQ-001', 'Charger'),
('EQ-001', 'Carry bag'),
('EQ-002', 'Console'),
('EQ-002', 'Left/Right Joy-Con'),
('EQ-002', 'Dock'),
('EQ-002', 'AC adapter'),
('EQ-002', 'HDMI cable'),
('EQ-003', 'H4n recorder'),
('EQ-003', 'Windscreen'),
('EQ-003', 'Power supply'),
('EQ-003', 'Case'),
('EQ-004', 'Scanner head'),
('EQ-004', 'Turntable'),
('EQ-004', 'Tripod'),
('EQ-005', 'Dual transmitters'),
('EQ-005', 'Single receiver'),
('EQ-005', '3.5mm TRS cable'),
('EQ-006', 'PS5 console'),
('EQ-006', 'DualSense controller'),
('EQ-006', 'HDMI cable'),
('EQ-010', 'Meeting Owl 3'),
('EQ-010', 'Power adapter'),
('EQ-010', 'USB-C cable');

-- Seed Borrowers (5 registered borrowers)
INSERT INTO `borrowers` (`netid`, `name`, `university_id`, `email`, `department`, `role`, `open_loans`, `status`) VALUES
('emma.wilson', 'Emma Wilson', '001482759', 'ewilson@ualbany.edu', 'Digital Arts & Media', 'Undergraduate Student', 1, 'good-standing'),
('james.chen', 'James Chen', '001573024', 'jchen@ualbany.edu', 'Computer Science', 'Undergraduate Student', 1, 'good-standing'),
('olivia.martinez', 'Olivia Martinez', '001492831', 'omartinez@ualbany.edu', 'Communications & Journalism', 'Graduate Student', 1, 'restricted'),
('noah.thompson', 'Noah Thompson', '001583902', 'nthompson@ualbany.edu', 'Mechanical Engineering', 'Undergraduate Student', 1, 'good-standing'),
('sophia.lee', 'Sophia Lee', '001482610', 'slee@ualbany.edu', 'Informatics', 'Undergraduate Student', 1, 'good-standing')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Loans (5 circulation records)
INSERT INTO `loans` (`id`, `equipment_id`, `borrower_netid`, `asset_tag`, `checkout_date`, `due_date`, `status`) VALUES
('LN-1042', 'EQ-001', 'emma.wilson', 'ALB-EQ-001-A', '2026-10-06 14:30:00', '2026-10-13 17:00:00', 'active'),
('LN-1041', 'EQ-002', 'james.chen', 'ALB-EQ-002-C', '2026-10-04 10:15:00', '2026-10-11 17:00:00', 'due-today'),
('LN-1040', 'EQ-003', 'olivia.martinez', 'ALB-EQ-003-B', '2026-10-02 11:00:00', '2026-10-09 17:00:00', 'overdue'),
('LN-1039', 'EQ-004', 'noah.thompson', 'ALB-EQ-004-A', '2026-10-05 13:45:00', '2026-10-12 17:00:00', 'active'),
('LN-1038', 'EQ-005', 'sophia.lee', 'ALB-EQ-005-B', '2026-10-04 09:30:00', '2026-10-11 17:00:00', 'due-today')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- Seed Preparation Queue Items (4 records across workflow stages)
INSERT INTO `preparation_items` (`id`, `equipment_id`, `equipment_name`, `category`, `assigned_staff`, `target_date`, `status`, `current_step`, `notes`) VALUES
('PREP-001', 'EQ-014', 'MacBook Pro 16" Lending Kit', 'Computing', 'Unassigned', '12 Oct 2026', 'awaiting', 1, 'Returned from faculty loan; needs wiped'),
('PREP-002', 'EQ-001', 'Mirrorless Camera Kit', 'Creative Technology', 'Linda Kovacs', '11 Oct 2026', 'in-prep', 3, 'Routine prep and sanitization after return'),
('PREP-003', 'EQ-003', 'H4 Zoom Audio Recording Kit', 'Creative Technology', 'Veronica Dindial', '11 Oct 2026', 'review', 4, 'Ready for supervisor sign-off'),
('PREP-004', 'EQ-002', 'Nintendo Switch', 'Gaming Consoles and Accessories', 'Amari Scott', '10 Oct 2026', 'ready', 4, 'Wiped and staged for ready shelf')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- Seed Preparation Checklist Steps
INSERT INTO `preparation_checklist_items` (`preparation_id`, `step_key`, `title`, `completed`) VALUES
('PREP-001', 'wipe', 'Factory Reset & Storage Sanitization', 0),
('PREP-001', 'inspect', 'Hardware Diagnostics & Screen Inspection', 0),
('PREP-001', 'accessories', 'Charger & USB-C Cable Verification', 0),
('PREP-001', 'packaging', 'Clean exterior and package in lending sleeve', 0),
('PREP-002', 'wipe', 'SD card format and factory reset', 1),
('PREP-002', 'inspect', 'Sensor cleaning and lens check', 1),
('PREP-002', 'battery', 'Battery fully charged and tested', 0),
('PREP-002', 'manifest', 'Accessory pouch verified', 0),
('PREP-003', 'wipe', 'SD card wipe', 1),
('PREP-003', 'inspect', 'Mic capsule check', 1),
('PREP-003', 'battery', 'AA batteries replenished', 1),
('PREP-003', 'supervisor', 'Supervisor sign-off', 0),
('PREP-004', 'wipe', 'User profiles removed', 1),
('PREP-004', 'inspect', 'Joy-Con drift test', 1),
('PREP-004', 'dock', 'Dock & cables verified', 1),
('PREP-004', 'shelf', 'Ready shelf staging', 1);

-- Seed Report Metrics
INSERT INTO `report_metrics` (`equipment_id`, `semester`, `checkouts_count`, `avg_loan_days`, `total_days_out`) VALUES
('EQ-001', 'Fall 2026', 6, 4.2, 25),
('EQ-002', 'Fall 2026', 5, 3.6, 18),
('EQ-003', 'Fall 2026', 5, 4.0, 20),
('EQ-004', 'Fall 2026', 3, 5.1, 15),
('EQ-005', 'Fall 2026', 4, 3.8, 15),
('EQ-006', 'Fall 2026', 4, 4.5, 18),
('EQ-007', 'Fall 2026', 2, 3.0, 6),
('EQ-008', 'Fall 2026', 3, 3.2, 10),
('EQ-009', 'Fall 2026', 2, 2.5, 5),
('EQ-010', 'Fall 2026', 3, 2.0, 6),
('EQ-013', 'Fall 2026', 1, 3.0, 3)
ON DUPLICATE KEY UPDATE `checkouts_count`=VALUES(`checkouts_count`);
