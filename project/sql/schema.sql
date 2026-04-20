-- Create Users Table with explicit RBAC
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN', 'SUPERUSER') DEFAULT 'USER',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension Tables
CREATE TABLE IF NOT EXISTS dim_crop (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    UNIQUE INDEX idx_crop_name (crop_name)
);

CREATE TABLE IF NOT EXISTS dim_country (
    country_id INT AUTO_INCREMENT PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    continent VARCHAR(100),
    UNIQUE INDEX idx_country_name (country_name)
);

CREATE TABLE IF NOT EXISTS dim_location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    country_id INT NOT NULL,
    state VARCHAR(150),
    district VARCHAR(150),
    region VARCHAR(150),
    FOREIGN KEY (country_id) REFERENCES dim_country(country_id),
    UNIQUE INDEX idx_location_details (country_id, state, district, region)
);

CREATE TABLE IF NOT EXISTS dim_time (
    time_id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month INT,
    season VARCHAR(50),
    UNIQUE INDEX idx_time_details (year, month, season)
);

-- Optimized dim_climate
CREATE TABLE IF NOT EXISTS dim_climate (
    climate_id INT AUTO_INCREMENT PRIMARY KEY,
    climate_hash VARCHAR(64) NOT NULL UNIQUE, -- md5 hash of metrics to prevent duplicates
    avg_temp DECIMAL(5,2),
    rainfall DECIMAL(7,2),
    rain_days INT,
    frost_days INT,
    heat_days INT,
    humidity DECIMAL(5,2)
);

-- Fact Table
CREATE TABLE IF NOT EXISTS fact_yield_data (
    fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    location_id INT NOT NULL,
    time_id INT NOT NULL,
    climate_id INT NOT NULL,
    sown_area DECIMAL(12,2),
    production DECIMAL(12,2),
    yield_value DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES dim_crop(crop_id),
    FOREIGN KEY (location_id) REFERENCES dim_location(location_id),
    FOREIGN KEY (time_id) REFERENCES dim_time(time_id),
    FOREIGN KEY (climate_id) REFERENCES dim_climate(climate_id)
);

-- Advanced Indexes for Performance
CREATE INDEX idx_fact_composite_1 ON fact_yield_data (location_id, time_id);
CREATE INDEX idx_fact_composite_2 ON fact_yield_data (crop_id, time_id);
CREATE INDEX idx_fact_yield ON fact_yield_data (yield_value);

-- Logs and Analytics
CREATE TABLE IF NOT EXISTS prediction_logs (
    pred_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    inputs_json JSON NOT NULL,
    predicted_yield DECIMAL(10,4) NOT NULL,
    shap_json JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS model_registry (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    algorithm VARCHAR(100),
    score DECIMAL(5,4),
    encoder_path VARCHAR(255),
    model_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT FALSE
);

-- Materialized View / Summary table equivalent
CREATE TABLE IF NOT EXISTS aggr_country_yearly_yield (
    country_id INT,
    year INT,
    avg_yield DECIMAL(10,4),
    total_production DECIMAL(15,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (country_id, year)
);
