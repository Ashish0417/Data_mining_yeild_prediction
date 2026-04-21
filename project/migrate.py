from sqlalchemy import create_engine, text

try:
    engine = create_engine("mysql+pymysql://cropuser:croppassword@127.0.0.1:3307/crop_yield_db")
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE model_registry ADD COLUMN crop_name VARCHAR(100) DEFAULT 'All';"))
    print("Migration applied successfully!")
except Exception as e:
    print(f"Error: {e}")
