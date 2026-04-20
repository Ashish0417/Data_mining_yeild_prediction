from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey, BIGINT, JSON, TIMESTAMP, text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="USER")
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class DimCrop(Base):
    __tablename__ = "dim_crop"
    crop_id = Column(Integer, primary_key=True, autoincrement=True)
    crop_name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100))

class DimCountry(Base):
    __tablename__ = "dim_country"
    country_id = Column(Integer, primary_key=True, autoincrement=True)
    country_name = Column(String(100), unique=True, nullable=False)
    continent = Column(String(100))

class DimLocation(Base):
    __tablename__ = "dim_location"
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    country_id = Column(Integer, ForeignKey("dim_country.country_id"), nullable=False)
    state = Column(String(150))
    district = Column(String(150))
    region = Column(String(150))
    country = relationship("DimCountry")

class DimTime(Base):
    __tablename__ = "dim_time"
    time_id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer)
    season = Column(String(50))

class DimClimate(Base):
    __tablename__ = "dim_climate"
    climate_id = Column(Integer, primary_key=True, autoincrement=True)
    climate_hash = Column(String(64), unique=True, nullable=False)
    avg_temp = Column(DECIMAL(5,2))
    rainfall = Column(DECIMAL(7,2))
    rain_days = Column(Integer)
    frost_days = Column(Integer)
    heat_days = Column(Integer)
    humidity = Column(DECIMAL(5,2))

class FactYieldData(Base):
    __tablename__ = "fact_yield_data"
    fact_id = Column(BIGINT, primary_key=True, autoincrement=True)
    crop_id = Column(Integer, ForeignKey("dim_crop.crop_id"), nullable=False)
    location_id = Column(Integer, ForeignKey("dim_location.location_id"), nullable=False)
    time_id = Column(Integer, ForeignKey("dim_time.time_id"), nullable=False)
    climate_id = Column(Integer, ForeignKey("dim_climate.climate_id"), nullable=False)
    sown_area = Column(DECIMAL(12,2))
    production = Column(DECIMAL(12,2))
    yield_value = Column(DECIMAL(10,4))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    crop = relationship("DimCrop")
    location = relationship("DimLocation")
    time = relationship("DimTime")
    climate = relationship("DimClimate")

class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    pred_id = Column(BIGINT, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    inputs_json = Column(JSON, nullable=False)
    predicted_yield = Column(DECIMAL(10,4), nullable=False)
    shap_json = Column(JSON)
    timestamp = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    log_id = Column(BIGINT, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action = Column(String(255), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(50))
    details = Column(JSON)
    timestamp = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    model_id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String(50), nullable=False, unique=True)
    algorithm = Column(String(100))
    score = Column(DECIMAL(5,4))
    encoder_path = Column(String(255))
    model_path = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    active = Column(Boolean, default=False)
    
class AggrCountryYearlyYield(Base):
    __tablename__ = "aggr_country_yearly_yield"
    country_id = Column(Integer, primary_key=True)
    year = Column(Integer, primary_key=True)
    avg_yield = Column(DECIMAL(10,4))
    total_production = Column(DECIMAL(15,2))
    last_updated = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))
