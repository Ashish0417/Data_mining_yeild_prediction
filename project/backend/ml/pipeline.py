import pandas as pd
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import os
import uuid
import database, models

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../models'))
os.makedirs(MODEL_DIR, exist_ok=True)

def extract_training_data(db: Session):
    query = """
    SELECT 
        c.country_name as country, 
        cr.crop_name as crop, 
        t.year, 
        cl.avg_temp, cl.rainfall, cl.rain_days, cl.frost_days, cl.heat_days, cl.humidity,
        f.sown_area, f.yield_value
    FROM fact_yield_data f
    JOIN dim_location l ON f.location_id = l.location_id
    JOIN dim_country c ON l.country_id = c.country_id
    JOIN dim_crop cr ON f.crop_id = cr.crop_id
    JOIN dim_time t ON f.time_id = t.time_id
    JOIN dim_climate cl ON f.climate_id = cl.climate_id
    WHERE f.yield_value IS NOT NULL
    """
    df = pd.read_sql(query, db.bind)
    return df

def train_and_register_model(db: Session, algorithm="xgboost"):
    df = extract_training_data(db)
    if df.empty or len(df) < 10:
        raise ValueError("Not enough data to train. Seed data first.")
    
    X = df.drop(columns=['yield_value'])
    y = df['yield_value']
    
    categorical_features = ['country', 'crop']
    numeric_features = ['year', 'avg_temp', 'rainfall', 'rain_days', 'frost_days', 'heat_days', 'humidity', 'sown_area']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    if algorithm == "random_forest":
        model = RandomForestRegressor(n_estimators=100, random_state=42)
    else:
        model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
        
    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', model)])
    pipeline.fit(X, y)
    
    preds = pipeline.predict(X)
    rmse = mean_squared_error(y, preds, squared=False)
    mae = mean_absolute_error(y, preds)
    r2 = r2_score(y, preds)
    
    version_id = str(uuid.uuid4())[:8]
    model_path = os.path.join(MODEL_DIR, f"model_{version_id}.joblib")
    joblib.dump(pipeline, model_path)
    
    # Save to model registry
    db.query(models.ModelRegistry).update({models.ModelRegistry.active: False})
    
    new_model = models.ModelRegistry(
        version=version_id,
        algorithm=algorithm,
        score=float(r2),
        model_path=model_path,
        active=True
    )
    db.add(new_model)
    db.commit()
    
    return {"version": version_id, "rmse": rmse, "mae": mae, "r2": r2, "model_path": model_path}
