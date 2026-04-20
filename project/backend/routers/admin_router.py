from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
import io
import json
import auth, models
from database import get_db
from ml import etl, data_mining
import redis

router = APIRouter(prefix="/admin", tags=["admin"])
redis_client = redis.Redis(host='redis', port=6379, db=0)

@router.post("/bulk-upload")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...), 
                     current_user: models.User = Depends(auth.get_admin_user),
                     db: Session = Depends(get_db)):
    
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    def process_etl(df, user_id):
        from database import SessionLocal
        local_db = SessionLocal()
        try:
            clean_df = etl.clean_and_transform(df)
            etl.load_data_to_warehouse(clean_df, local_db)
            auth.log_audit(local_db, user_id, "Bulk Upload ETL Processed", details={"rows": len(df)})
        except Exception as e:
            auth.log_audit(local_db, user_id, "Bulk Upload Failed", details={"error": str(e)})
        finally:
            local_db.close()
    
    background_tasks.add_task(process_etl, df, current_user.user_id)
    return {"message": "CSV upload accepted, running ETL in background."}

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
