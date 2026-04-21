from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schemas, auth, models
from database import get_db
from ml import predict

router = APIRouter(prefix="/user", tags=["user"])

@router.post("/predict-yield", response_model=schemas.YieldPredictionOutput)
def predict_crop_yield(input_data: schemas.YieldPredictionInput, 
                       current_user: models.User = Depends(auth.get_current_user),
                       db: Session = Depends(get_db)):
    
    # Validation constraints handled by Pydantic Model.
    result = predict.predict_yield(input_data.dict(), current_user.user_id)
    return result

@router.get("/my-predictions")
def get_prediction_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    logs = db.query(models.PredictionLog).filter(models.PredictionLog.user_id == current_user.user_id).order_by(models.PredictionLog.timestamp.desc()).limit(50).all()
    return logs

@router.get("/models")
def get_active_models(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Give user access to active models for each crop to choose from
    return db.query(models.ModelRegistry).all()
