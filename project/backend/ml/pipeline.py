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

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
os.makedirs(MODEL_DIR, exist_ok=True)

def extract_training_data(db: Session):
    query = """
    SELECT 
        c.country_name as country, 
        cr.crop_name as crop, 
        t.year, 
        cl.avg_temp, cl.rainfall, cl.rain_days, cl.frost_days, cl.heat_days, cl.humidity,
        f.sown_area, f.production, f.yield_value
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
    
    # Notebook explicitly trains on ['sown_area', 'production', 'avg_temp', 'rainfall', 'rain_days', 'frost_days', 'heat_days']
    # And it scales them. We'll include year & humidity just in case, but follow notebook numerical style.
    # The categorical 'country' is omitted here since notebook doesn't use it, but we can keep it if we want.
    # We will implement crop-specific training!
    
    algorithms = get_algorithm_mapping()
    if algorithm != "all":
        if algorithm not in algorithms: raise ValueError(f"Unknown algorithm {algorithm}")
        algorithms = {algorithm: algorithms[algorithm]}
        
    print(f"Loaded {len(algorithms)} algorithms to train. Starting training loop...", flush=True)
    results = []
    
    # If algorithm == "all", we deactivate all models for all crops by default?
    # Better: just append the new models and later activate the best ones.
    if algorithm == "all":
        db.query(models.ModelRegistry).update({models.ModelRegistry.active: False})

    unique_crops = df['crop'].dropna().unique()
    
    best_model_per_crop = {} # crop -> best model_id
    
    for crop_name in unique_crops:
        print(f"\n--- Processing crop: {crop_name} ---", flush=True)
        df_crop = df[df['crop'] == crop_name].copy()
        if len(df_crop) < 10:
            print(f"Skipping {crop_name}: not enough data ({len(df_crop)} rows).", flush=True)
            continue
            
        print(f"Dataset extracted. Shape: {df_crop.shape}", flush=True)
        X = df_crop.drop(columns=['yield_value', 'crop'])
        y = df_crop['yield_value']
        
        # Determine features that exist
        numeric_features = ['year', 'avg_temp', 'rainfall', 'rain_days', 'frost_days', 'heat_days', 'humidity', 'sown_area', 'production']
        numeric_features = [f for f in numeric_features if f in X.columns]
        categorical_features = ['country']
        categorical_features = [f for f in categorical_features if f in X.columns]
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ])
            
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=1)
        
        best_r2_score = -float('inf')
        
        for algo_name, model in algorithms.items():
            print(f"  > Training {algo_name}...", flush=True)
            regressor = TransformedTargetRegressor(
                regressor=model,
                transformer=StandardScaler()
            )
            
            pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', regressor)])
            pipeline.fit(X_train, y_train)
            
            preds = pipeline.predict(X_test)
            rmse = mean_squared_error(y_test, preds) ** 0.5
            mae = mean_absolute_error(y_test, preds)
            r2 = r2_score(y_test, preds)
            
            print(f"    - Completed! R2: {r2:.4f}, RMSE: {rmse:.4f}, MAE: {mae:.4f}", flush=True)
            
            version_id = f"{crop_name[:3].upper()}_{str(uuid.uuid4())[:8]}"
            model_path = os.path.join(MODEL_DIR, f"model_{version_id}.joblib")
            joblib.dump(pipeline, model_path)
            
            new_model = models.ModelRegistry(
                version=version_id,
                algorithm=algo_name,
                r2_score=float(r2),
                rmse=float(rmse),
                mae=float(mae),
                model_path=model_path,
                active=False,
                crop_name=crop_name
            )
            db.add(new_model)
            db.flush()
            
            if r2 > best_r2_score:
                best_r2_score = r2
                best_model_per_crop[crop_name] = new_model.model_id
                
            results.append({"crop": crop_name, "algorithm": algo_name, "version": version_id, "rmse": rmse, "mae": mae, "r2": r2})
            
    # Activate best models for each crop
    if algorithm == "all":
        for c, m_id in best_model_per_crop.items():
            best = db.query(models.ModelRegistry).filter(models.ModelRegistry.model_id == m_id).first()
            if best: best.active = True
            
    db.commit()
    return results
