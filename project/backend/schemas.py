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
    r2: float
    algorithm: str
    version: str
