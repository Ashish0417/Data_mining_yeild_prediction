from fastapi import APIRouter, Depends, BackgroundTasks, Body, HTTPException
from sqlalchemy.orm import Session
import auth, models, schemas
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
            res = pipeline.train_and_register_model(local_db, algorithm="all")
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

@router.delete("/data/{fact_id}")
def delete_fact_data(fact_id: int, current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    fact = db.query(models.FactYieldData).filter(models.FactYieldData.fact_id == fact_id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Data not found")
    fact.is_deleted = True
    db.commit()
    auth.log_audit(db, current_user.user_id, "Soft Delete Data", details={"fact_id": fact_id})
    return {"message": "Data successfully archived/deleted."}

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role: str = Body(embed=True), current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    if role not in ["USER", "ADMIN", "SUPERUSER"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    auth.log_audit(db, current_user.user_id, "User Role Updated", details={"target_user": user_id, "new_role": role})
    return {"message": f"User upgraded to {role}"}

@router.put("/users/{user_id}/active")
def toggle_user_active(user_id: int, active: bool = Body(embed=True), current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.active = active
    db.commit()
    return {"message": f"User active status changed to {active}"}

@router.get("/models")
def get_models(current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    return db.query(models.ModelRegistry).order_by(models.ModelRegistry.created_at.desc()).all()

@router.put("/models/activate/{model_id}")
def activate_model(model_id: int, current_user: models.User = Depends(auth.get_super_user), db: Session = Depends(get_db)):
    model = db.query(models.ModelRegistry).filter(models.ModelRegistry.model_id == model_id).first()
    if not model: raise HTTPException(status_code=404, detail="Model not found")
    # Deactivate all others
    db.query(models.ModelRegistry).update({models.ModelRegistry.active: False})
    # Activate this
    model.active = True
    db.commit()
    auth.log_audit(db, current_user.user_id, "ML Model Activated", details={"version": model.version})
    return {"message": f"Model {model.version} activated successfully."}
