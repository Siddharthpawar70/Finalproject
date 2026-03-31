-- Global Horizon Tour (GHT) Database Schema
-- Run this in phpMyAdmin or MySQL CLI to set up the database

CREATE DATABASE IF NOT EXISTS ght_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ght_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin account (password: admin123)
-- Hash generated with password_hash('admin123', PASSWORD_DEFAULT)
-- To regenerate: php -r "echo password_hash('admin123', PASSWORD_DEFAULT);"
INSERT IGNORE INTO users (name, email, phone, password_hash, role, status)
VALUES ('Admin', 'admin@ght.com', '0000000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'approved');

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(20) NOT NULL UNIQUE,
    user_id INT,
    user_email VARCHAR(150),
    cust_name VARCHAR(150) NOT NULL,
    cust_phone VARCHAR(20) NOT NULL,
    cust_email VARCHAR(150) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    travel_date DATE NOT NULL,
    adults INT DEFAULT 1,
    children INT DEFAULT 0,
    transport_mode VARCHAR(50) DEFAULT 'flight',
    transport_details TEXT,
    special_notes TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'cash',
    discount_applied VARCHAR(100) DEFAULT 'None',
    status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Contact Messages table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) DEFAULT '',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packages table (for real-time updates)
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    image VARCHAR(255),
    duration VARCHAR(100),
    destination VARCHAR(100),
    itinerary TEXT,
    transport VARCHAR(100),
    stay VARCHAR(100),
    meals VARCHAR(100),
    activities VARCHAR(100),
    inclusions TEXT,
    exclusions TEXT,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations table
CREATE TABLE IF NOT EXISTS destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    airport VARCHAR(150),
    railway VARCHAR(150),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

