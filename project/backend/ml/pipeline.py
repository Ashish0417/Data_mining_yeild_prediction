import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.ensemble import BaggingRegressor, RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.neural_network import MLPRegressor
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

def get_algorithm_mapping():
    return {
        "Bagging (BG)": BaggingRegressor(estimator=DecisionTreeRegressor(), n_estimators=100, random_state=1),
        "Decision Table (Proxy)": DecisionTreeRegressor(max_depth=3, random_state=1),
        "Random Forest (RF)": RandomForestRegressor(n_estimators=100, max_depth=None, random_state=1),
        "ANN-MLP": MLPRegressor(hidden_layer_sizes=(50,), activation='logistic', solver='lbfgs', max_iter=2000, random_state=1)
    }

def train_and_register_model(db: Session, algorithm="all"):
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
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=1)
    
    algorithms = get_algorithm_mapping()
    if algorithm != "all":
        if algorithm not in algorithms: raise ValueError(f"Unknown algorithm {algorithm}")
        algorithms = {algorithm: algorithms[algorithm]}
        
    results = []
    
    if algorithm == "all":
        db.query(models.ModelRegistry).update({models.ModelRegistry.active: False})
        
    best_r2_score = -float('inf')
    best_model_id = None
        
    for algo_name, model in algorithms.items():
        regressor = TransformedTargetRegressor(
            regressor=model,
            transformer=StandardScaler()
        )
        
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', regressor)])
        pipeline.fit(X_train, y_train)
        
        preds = pipeline.predict(X_test)
        rmse = mean_squared_error(y_test, preds, squared=False)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        
        version_id = str(uuid.uuid4())[:8]
        model_path = os.path.join(MODEL_DIR, f"model_{version_id}.joblib")
        joblib.dump(pipeline, model_path)
        
        new_model = models.ModelRegistry(
            version=version_id,
            algorithm=algo_name,
            r2_score=float(r2),
            rmse=float(rmse),
            mae=float(mae),
            model_path=model_path,
            active=False
        )
        db.add(new_model)
        db.flush()
        
        if r2 > best_r2_score:
            best_r2_score = r2
            best_model_id = new_model.model_id
            
        results.append({"algorithm": algo_name, "version": version_id, "rmse": rmse, "mae": mae, "r2": r2})
    
    if algorithm == "all" and best_model_id:
        best = db.query(models.ModelRegistry).filter(models.ModelRegistry.model_id == best_model_id).first()
        if best: best.active = True
        
    db.commit()
    return results
