CREATE DATABASE greenhive;
USE greenhive;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    user_type ENUM('producer', 'composter') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zipcode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE waste_types (
    waste_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE waste_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    producer_id INT NOT NULL,
    waste_type_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    availability_start DATE NOT NULL,
    availability_end DATE NOT NULL,
    pickup_time_start TIME,
    pickup_time_end TIME,
    status ENUM('available', 'pending', 'matched', 'completed', 'expired') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producer_id) REFERENCES users(user_id),
    FOREIGN KEY (waste_type_id) REFERENCES waste_types(waste_type_id)
);

CREATE TABLE composter_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    composter_id INT NOT NULL,
    waste_type_id INT NOT NULL,
    max_quantity DECIMAL(10, 2),
    FOREIGN KEY (composter_id) REFERENCES users(user_id),
    FOREIGN KEY (waste_type_id) REFERENCES waste_types(waste_type_id)
);

CREATE TABLE matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    composter_id INT NOT NULL,
    score DECIMAL(5, 4) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES waste_listings(listing_id),
    FOREIGN KEY (composter_id) REFERENCES users(user_id)
);

CREATE TABLE environmental_impact (
    impact_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    waste_type_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    co2_saved DECIMAL(10, 2) NOT NULL,
    water_saved DECIMAL(10, 2) NOT NULL,
    landfill_diverted DECIMAL(10, 2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (waste_type_id) REFERENCES waste_types(waste_type_id)
);
