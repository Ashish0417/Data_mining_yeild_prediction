from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Any
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

# Prediction
class YieldPredictionInput(BaseModel):
    country: str = Field(..., description="Country name")
    crop: str = Field(..., description="Crop name")
    year: int = Field(..., ge=1900, le=2100)
    avg_temp: float = Field(..., description="Average Temperature")
    rainfall: float = Field(..., description="Annual Rainfall in mm")
    rain_days: int = Field(0, description="Number of rainy days")
    frost_days: int = Field(0, description="Number of frost days")
    heat_days: int = Field(0, description="Number of heat days")
    humidity: float = Field(0.0, description="Humidity percentage")
    sown_area: float = Field(..., gt=0, description="Area sown in hectares")

class YieldPredictionOutput(BaseModel):
    predicted_yield: float
    production_estimate: float
    shap_explaination: Optional[Any] = None

class ModelTrainingMetrics(BaseModel):
    rmse: float
    mae: float
    r2_score: float
    algorithm: str
    version: str

# System Management
class YieldDataCreate(BaseModel):
    country: str
    state: Optional[str] = None
    district: Optional[str] = None
    region: Optional[str] = None
    crop: str
    year: int
    avg_temp: float
    rainfall: float
    rain_days: int = 0
    frost_days: int = 0
    heat_days: int = 0
    humidity: float = 0.0
    sown_area: float
    production: float

class YieldDataOut(BaseModel):
    fact_id: int
    country: str
    crop: str
    year: int
    sown_area: float
    production: float
    yield_value: float
    is_deleted: bool
    created_at: datetime
