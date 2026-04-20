import joblib
import pandas as pd
import shap
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import json

def load_active_model(db: Session):
    model_record = db.query(models.ModelRegistry).filter(models.ModelRegistry.active == True).first()
    if not model_record:
        return None
    pipeline = joblib.load(model_record.model_path)
    return pipeline

def predict_yield(input_data: dict, user_id: int):
    db: Session = SessionLocal()
    pipeline = load_active_model(db)
    if not pipeline:
        db.close()
        raise ValueError("No active machine learning model found. Run training first.")
    
    df = pd.DataFrame([input_data])
    predicted_yield = float(pipeline.predict(df)[0])
    production_estimate = predicted_yield * input_data.get('sown_area', 1.0)
    
    # SHAP Explainability
    regressor = pipeline.named_steps['regressor']
    preprocessor = pipeline.named_steps['preprocessor']
    X_transformed = preprocessor.transform(df)
    
    shap_json = None
    try:
        explainer = shap.TreeExplainer(regressor)
        shap_values = explainer.shap_values(X_transformed)
        # Convert to native python list
        shap_json = shap_values.tolist() if hasattr(shap_values, 'tolist') else list(shap_values)
    except Exception as e:
        print(f"SHAP Error: {e}")
    
    # Log prediction
    log = models.PredictionLog(
        user_id=user_id,
        inputs_json=input_data,
        predicted_yield=predicted_yield,
        shap_json=shap_json
    )
    db.add(log)
    db.commit()
    db.close()
    
    return {
        "predicted_yield": predicted_yield,
        "production_estimate": production_estimate,
        "shap_explaination": shap_json
    }
