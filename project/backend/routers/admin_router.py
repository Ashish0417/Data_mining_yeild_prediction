from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import io
import json
import auth, models, schemas
from database import get_db
from ml import etl, data_mining
import redis

router = APIRouter(prefix="/admin", tags=["admin"])
redis_client = redis.Redis(host='redis', port=6379, db=0)

@router.post("/bulk-upload")
async def upload_csv(background_tasks: BackgroundTasks, 
                     file: UploadFile = File(...), 
                     country: str = Form(None),
                     state: str = Form(None),
                     district: str = Form(None),
                     region: str = Form(None),
                     crop: str = Form(None),
                     column_mapping: str = Form(None),
                     current_user: models.User = Depends(auth.get_admin_user),
                     db: Session = Depends(get_db)):
    
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    if column_mapping:
        try:
            mapping = json.loads(column_mapping)
            df.rename(columns=mapping, inplace=True)
        except Exception:
            pass
            
    # Auto-detect columns heuristically via dictionary bounds
    column_maps = {
        'yield_value': ['_avg_yield', 'yield_value', 'yield'],
        'sown_area': ['_sown_area', 'sown_area', 'area'],
        'production': ['_production', 'production'],
        'avg_temp': ['tmean', 'avg_temp', 'temp'],
        'rainfall': ['prcp', 'rainfall', 'precip'],
        'rain_days': ['rd', 'rain_days'],
        'frost_days': ['fd', 'frost_days'],
        'heat_days': ['hd', 'heat_days', 'heat']
    }
    
    for target_col, variants in column_maps.items():
        if target_col not in df.columns:
            for c in df.columns:
                if any(v.lower() in c.lower() for v in variants):
                    df.rename(columns={c: target_col}, inplace=True)
                    break
            
    if country: df['country'] = country
    if state: df['state'] = state
    if district: df['district'] = district
    if region: df['region'] = region
    if crop: df['crop'] = crop
    
    def process_etl(df, user_id):
        from database import SessionLocal
        local_db = SessionLocal()
        try:
            # Prevent duplicate uploads conceptually applied in DB logic via climate hash + composite bounds
            clean_df = etl.clean_and_transform(df)
            etl.load_data_to_warehouse(clean_df, local_db)
            auth.log_audit(local_db, user_id, "Bulk Upload ETL Processed", details={"rows": len(df)})
        except Exception as e:
            auth.log_audit(local_db, user_id, "Bulk Upload Failed", details={"error": str(e)})
        finally:
            local_db.close()
    
    background_tasks.add_task(process_etl, df, current_user.user_id)
    return {"message": "CSV upload accepted, mapping applied, running ETL in background."}

@router.get("/data")
def get_data(skip: int = 0, limit: int = 50, country: Optional[str] = None, crop: Optional[str] = None, year: Optional[int] = None,
             current_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    query = db.query(models.FactYieldData).filter(models.FactYieldData.is_deleted == False)
    
    if country:
        query = query.join(models.DimLocation).join(models.DimCountry).filter(models.DimCountry.country_name.ilike(f"%{country}%"))
    if crop:
        query = query.join(models.DimCrop).filter(models.DimCrop.crop_name.ilike(f"%{crop}%"))
    if year:
        query = query.join(models.DimTime).filter(models.DimTime.year == year)
    
    total = query.count()
    data = query.offset(skip).limit(limit).all()
    
    results = []
    for d in data:
        results.append({
            "fact_id": d.fact_id,
            "country": d.location.country.country_name if (d.location and d.location.country) else "Unknown",
            "crop": d.crop.crop_name if d.crop else "Unknown",
            "year": d.time.year if d.time else 0,
            "sown_area": float(d.sown_area) if d.sown_area else 0,
            "production": float(d.production) if d.production else 0,
            "yield_value": float(d.yield_value) if d.yield_value else 0,
            "is_deleted": d.is_deleted,
            "created_at": d.created_at
        })
    return {"total": total, "data": results}

@router.post("/data/single")
def create_single_data(data: schemas.YieldDataCreate, 
                       current_user: models.User = Depends(auth.get_admin_user), 
                       db: Session = Depends(get_db)):
    row = data.model_dump()
    df = pd.DataFrame([row])
    try:
        clean_df = etl.clean_and_transform(df)
        etl.load_data_to_warehouse(clean_df, db)
        auth.log_audit(db, current_user.user_id, "Single Data Entry", details={"crop": data.crop})
        return {"message": "Data entered via single form successfully."}
    except Exception as e:
        auth.log_audit(db, current_user.user_id, "Single Data Entry Failed", details={"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports/kmeans")
def kmeans_report(current_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    try:
        cached = redis_client.get('kmeans_report')
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    
    clusters = data_mining.get_kmeans_clusters(db)
    
    try:
        redis_client.setex('kmeans_report', 3600, json.dumps(clusters))
    except Exception:
        pass
    return clusters

@router.get("/reports/apriori")
def apriori_report(current_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    try:
        cached = redis_client.get('apriori_report')
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    
    rules = data_mining.get_association_rules(db)
    
    try:
        redis_client.setex('apriori_report', 3600, json.dumps(rules))
    except Exception:
        pass
    return rules
