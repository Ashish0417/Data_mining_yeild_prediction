from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routers import auth_router, user_router, admin_router, superuser_router

# Auto-create tables in DB
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Crop Yield Prediction Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(admin_router.router)
app.include_router(superuser_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
