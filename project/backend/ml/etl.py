import pandas as pd
import hashlib
from sqlalchemy.orm import Session
import models

def generate_climate_hash(avg_temp, rainfall, rain_days, frost_days, heat_days, humidity):
    metrics = f"{float(avg_temp):.2f}_{float(rainfall):.2f}_{int(rain_days)}_{int(frost_days)}_{int(heat_days)}_{float(humidity):.2f}"
    return hashlib.md5(metrics.encode()).hexdigest()

def clean_and_transform(df: pd.DataFrame) -> pd.DataFrame:
    """ETL transform phase validating data"""
    if 'avg_temp' in df.columns:
        df['avg_temp'] = df['avg_temp'].fillna(df['avg_temp'].mean())
    if 'rainfall' in df.columns:
        df['rainfall'] = df['rainfall'].fillna(0)
    df.fillna(0, inplace=True)
    return df

def load_data_to_warehouse(df: pd.DataFrame, db: Session):
    """Bulk loads preprocessed data into Snowflake schema."""
    for _, row in df.iterrows():
        # Get or create dimensions
        # Time
        time_rec = db.query(models.DimTime).filter_by(year=int(row['year'])).first()
        if not time_rec:
            time_rec = models.DimTime(year=int(row['year']))
            db.add(time_rec)
            db.commit()
            db.refresh(time_rec)
            
        # Country mapping
        country_rec = db.query(models.DimCountry).filter_by(country_name=str(row['country'])).first()
        if not country_rec:
            country_rec = models.DimCountry(country_name=str(row['country']))
            db.add(country_rec)
            db.commit()
            db.refresh(country_rec)
            
        # Location 
        loc_rec = db.query(models.DimLocation).filter_by(country_id=country_rec.country_id).first()
        if not loc_rec:
            loc_rec = models.DimLocation(country_id=country_rec.country_id)
            db.add(loc_rec)
            db.commit()
            db.refresh(loc_rec)
            
        # Crop 
        crop_name = str(row['crop'])
        crop_rec = db.query(models.DimCrop).filter_by(crop_name=crop_name).first()
        if not crop_rec:
            crop_rec = models.DimCrop(crop_name=crop_name)
            db.add(crop_rec)
            db.commit()
            db.refresh(crop_rec)
            
        # Climate (Optimized with hash)
        c_hash = generate_climate_hash(
            row.get('avg_temp', 0), row.get('rainfall', 0), 
            row.get('rain_days', 0), row.get('frost_days', 0),
            row.get('heat_days', 0), row.get('humidity', 0.0)
        )
        climate_rec = db.query(models.DimClimate).filter_by(climate_hash=c_hash).first()
        if not climate_rec:
            climate_rec = models.DimClimate(
                climate_hash=c_hash, avg_temp=row.get('avg_temp',0),
                rainfall=row.get('rainfall',0), rain_days=row.get('rain_days',0),
                frost_days=row.get('frost_days',0), heat_days=row.get('heat_days',0),
                humidity=row.get('humidity',0)
            )
            db.add(climate_rec)
            db.commit()
            db.refresh(climate_rec)
            
        # Fact
        fact = models.FactYieldData(
            crop_id=crop_rec.crop_id,
            location_id=loc_rec.location_id,
            time_id=time_rec.time_id,
            climate_id=climate_rec.climate_id,
            sown_area=row.get('sown_area', 0),
            production=row.get('production', 0),
            yield_value=row.get('yield_value', 0)
        )
        db.add(fact)
    db.commit()
