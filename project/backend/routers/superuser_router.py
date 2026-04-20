from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import auth, models
from database import get_db
from ml import pipeline

router = APIRouter(prefix="/superuser", tags=["superuser"])

@router.post("/retrain-model")
def trigger_retraining(background_tasks: BackgroundTasks, 
                       current_user: models.User = Depends(auth.get_super_user), 
                       db: Session = Depends(get_db)):
    
    def background_train(user_id):
        from database import SessionLocal
        local_db = SessionLocal()
        try:
            res = pipeline.train_and_register_model(local_db, algorithm="random_forest")
            auth.log_audit(local_db, user_id, "ML Retraining Completed", details=res)
        except Exception as e:
            auth.log_audit(local_db, user_id, "ML Retraining Failed", details={"error": str(e)})
        finally:
            local_db.close()

    background_tasks.add_task(background_train, current_user.user_id)
    auth.log_audit(db, current_user.user_id, "ML Retraining Triggered")
    return {"message": "Retraining task scheduled in the background."}

@router.get("/audit-logs")
def get_audit_logs(current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return logs
