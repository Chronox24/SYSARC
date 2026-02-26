-- Barangay Certificate System Database
-- Database for managing certificate requests and resident information
-- Drop existing tables to replace old schema

-- Create Database
CREATE DATABASE IF NOT EXISTS `brgy_database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `brgy_database`;

-- --------------------------------------------------------

-- Drop existing tables if they exist (to replace old schema)
--

DROP TABLE IF EXISTS `certificate_requests`;
DROP TABLE IF EXISTS `residents`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `civil_status` varchar(30) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `home_address` text DEFAULT NULL,
  `mobile_phone` varchar(20) DEFAULT NULL,
  `post_grad_course` varchar(150) DEFAULT NULL,
  `post_grad_year` varchar(4) DEFAULT NULL,
  `college_course` varchar(150) DEFAULT NULL,
  `college_year` varchar(4) DEFAULT NULL,
  `high_school` varchar(150) DEFAULT NULL,
  `high_school_year` varchar(4) DEFAULT NULL,
  `elementary` varchar(150) DEFAULT NULL,
  `elementary_year` varchar(4) DEFAULT NULL,
  `other_education` varchar(150) DEFAULT NULL,
  `other_year` varchar(4) DEFAULT NULL,
  `emergency_name` varchar(150) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `emergency_address` text DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `signature_file` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificate_requests`
--

CREATE TABLE `certificate_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `certificate_type` varchar(100) NOT NULL,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `verification_status` enum('Verified','Not Verified','Not Valid') DEFAULT 'Not Verified',
  `process_status` enum('In process','Claimed','Void') DEFAULT 'In process',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `certificate_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `residents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- AUTO_INCREMENT for tables
--
ALTER TABLE `residents` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `certificate_requests` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `admins` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

-- Sample data (optional - uncomment to add sample admin user)
--

-- INSERT INTO `admins` (`name`, `role`, `email`, `password`) VALUES 
-- ('Admin User', 'Administrator', 'admin@brgy.local', '$2b$10$YourHashedPasswordHere');

COMMIT;
