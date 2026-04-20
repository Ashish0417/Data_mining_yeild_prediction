# AgriAnalytics Pro - Crop Yield Prediction Platform

A production-grade Crop Yield Prediction + Data Warehouse + Data Mining Platform.

## 🌟 Features Implemented
- **Snowflake Schema Data Warehouse** (MySQL 8) with optimized dimension hashes and composite indexes.
- **Data Mining via Redis & Apriori/KMeans**: Materialized insights exposed via a high-speed cache.
- **ETL Pipeline**: Raw datasets are cleaned/validated via an asynchronous background task engine.
- **Machine Learning Extraction**: XGBoost and RandomForest trained iteratively on warehouse data with full model registry object retention in the `models/` directory.
- **SHAP Explainability**: ML inference vectors are automatically returned to users dynamically via the dashboard endpoints.
- **Deep RBAC Implementation**: Strict constraints separating User/Farmer, Admin, and SuperUser roles.

## 🚀 Setup & Run (Docker Compose)
1. Enter the generated `project` root.
2. Build and start the integrated cluster:
   ```bash
   docker-compose up --build -d
   ```
3. Navigate to **http://localhost:3000** for the dynamic React Dashboard. 
4. Sign in contextually (the very first user to register their account automatically receives the `SUPERUSER` clearance, the rest default to `USER`).

## 🗃️ Disaster Recovery Utilities
Database backups are localized in the `scripts/` folder. Ensure the cluster is running, then execute:
- `./scripts/backup.sh` to extract the entire MySQL warehouse state globally.
- `./scripts/restore.sh <file>` to seamlessly overwrite.
