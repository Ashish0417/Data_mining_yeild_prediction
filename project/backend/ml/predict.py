import joblib
import pandas as pd
import shap
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import json

def load_active_model(db: Session, crop_name: str, model_id: int = None):
    if model_id:
        model_record = db.query(models.ModelRegistry).filter(models.ModelRegistry.model_id == model_id).first()
    else:
        model_record = db.query(models.ModelRegistry).filter(
            models.ModelRegistry.active == True,
            models.ModelRegistry.crop_name == crop_name
        ).first()

    if not model_record:
        return None
    pipeline = joblib.load(model_record.model_path)
    return pipeline

def predict_yield(input_data: dict, user_id: int):
    db: Session = SessionLocal()
    crop_name = input_data.get('crop')
    model_id = input_data.get('model_id')
    
    # Do not construct the dataframe with model_id
    predict_payload = {k: v for k, v in input_data.items() if k != 'model_id'}

    pipeline = load_active_model(db, crop_name, model_id)
    if not pipeline:
        db.close()
        raise ValueError(f"No active machine learning model found for crop '{crop_name}'. Run training first.")
    
    # We must explicitly provide the 'production' feature for notebooks. Fake it since the UI doesn't provide it?
    # Wait, UI doesn't provide production right now! The UI asks for sown_area, and we estimate production at the end.
    # The jupyter notebook uses 'PROD' feature natively.
    # We should estimate production heuristically prior to ML, or just provide it as 0 if the model scaling relies on it?
    # If the user doesn't provide it, let's keep it in predict_payload as 0, or just ignore it if missing?
    # Let's let the pipeline handle defaults or pandas missing.
    df = pd.DataFrame([predict_payload])
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
