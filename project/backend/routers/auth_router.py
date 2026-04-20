from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import schemas, models, auth
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    # Defaulting first user to SUPERUSER for testing, else USER
    role = "SUPERUSER" if db.query(models.User).count() == 0 else "USER"
    new_user = models.User(username=user.username, email=user.email, password_hash=hashed_pwd, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    auth.log_audit(db, new_user.user_id, "User registration", "User", str(new_user.user_id))
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.user_id})
    auth.log_audit(db, user.user_id, "User login")
    return {"access_token": access_token, "token_type": "bearer"}
