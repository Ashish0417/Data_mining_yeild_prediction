# Backend Integration Guide

This document explains how the frontend integrates with the backend API.

## Architecture Overview

```
Frontend (React/Vite)
    ↓
API Client (services/api.ts)
    ↓
Auth Context (context/AuthContext.tsx)
    ↓
FastAPI Backend
    ↓
Database (PostgreSQL/MySQL)
```

## API Client Setup

The `src/services/api.ts` file exports an `apiClient` instance that handles:

- Base URL configuration from `VITE_API_URL`
- JWT token management
- Request/response interceptors
- Error handling

```typescript
import { apiClient } from './services/api';

// Login
await apiClient.login(username, password);

// Make prediction
const result = await apiClient.predictYield(predictionData);

// Upload CSV
await apiClient.uploadCsvFile(file);
```

## Authentication

### Login Flow

1. User enters username and password
2. Frontend sends POST request to `/auth/login` with form data
3. Backend validates credentials
4. Backend returns JWT token
5. Token stored in localStorage
6. Token added to all subsequent requests

```typescript
const { access_token } = await apiClient.login(username, password);
localStorage.setItem('access_token', access_token);
```

### Protected Routes

Routes are protected via `ProtectedRoute` component:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

Unauthenticated users are redirected to login.

## Data Models

### User Registration

```typescript
interface UserCreate {
  username: string;
  email: string;
  password: string;
}
```

- Username: 3-50 characters
- Email: Valid email format
- Password: Minimum 6 characters

### Crop Yield Prediction Input

```typescript
interface YieldPredictionInput {
  country: string;
  crop: string;
  year: number;
  avg_temp: number;
  rainfall: number;
  rain_days: number;
  frost_days: number;
  heat_days: number;
  humidity: number;
  sown_area: number;
}
```

### Prediction Output

```typescript
interface YieldPredictionOutput {
  predicted_yield: number;      // kg/ha
  production_estimate: number;  // kg
  shap_explaination?: number[];
}
```

## Component Integration

### Login Component

- Uses `useAuth()` hook to access auth context
- Calls `login()` method on form submit
- Redirects to dashboard on success

```typescript
const { login, isLoading, error } = useAuth();
await login(username, password);
```

### PredictionForm Component

- Collects agricultural parameters
- Validates inputs
- Calls `apiClient.predictYield()`
- Displays prediction results with SHAP data

```typescript
const result = await apiClient.predictYield({
  country: "India",
  crop: "wheat",
  year: 2024,
  avg_temp: 22.5,
  rainfall: 1200,
  rain_days: 120,
  frost_days: 30,
  heat_days: 50,
  humidity: 65,
  sown_area: 100
});
```

### UploadData Component

- File input with CSV validation
- Sends file to `/admin/bulk-upload` endpoint
- Shows upload status
- Maintains history of uploads

```typescript
const result = await apiClient.uploadCsvFile(file);
// Returns: { message: "CSV upload accepted..." }
```

## Error Handling

All API errors are caught and displayed to users:

```typescript
try {
  const result = await apiClient.predictYield(data);
} catch (err: any) {
  const message = err.response?.data?.detail || 'Failed';
  setError(message);
}
```

Common error responses:

- `400`: Validation error (missing/invalid fields)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

## Caching

Admin reports are cached in Redis (1 hour TTL):

- `GET /admin/reports/kmeans` - K-means clustering
- `GET /admin/reports/apriori` - Association rules

Subsequent requests return cached data, reducing computation.

## Background Tasks

File uploads trigger background ETL processing:

1. File validation
2. Data cleaning via `etl.clean_and_transform()`
3. Loading to warehouse via `etl.load_data_to_warehouse()`
4. Audit logging

Frontend shows "processing" status immediately; users can check status later.

## Database Models Used

### User Model
```python
class User(Base):
    user_id: int (PK)
    username: str (unique)
    email: str (unique)
    password_hash: str
    role: str (USER, ADMIN, SUPERUSER)
    active: bool
    created_at: timestamp
```

### PredictionLog Model
```python
class PredictionLog(Base):
    pred_id: int (PK)
    user_id: int (FK)
    inputs_json: dict
    predicted_yield: decimal
    shap_json: dict
    timestamp: timestamp
```

### AuditLog Model
```python
class AuditLog(Base):
    log_id: int (PK)
    user_id: int (FK)
    action: str
    entity_type: str
    entity_id: str
    details: dict
    timestamp: timestamp
```

## Environment Setup

Frontend needs backend running:

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
pnpm dev
```

Then configure in `.env`:

```
VITE_API_URL=http://localhost:8000
```

## Testing Endpoints

Use curl or Postman to test endpoints:

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=password123"

# Predict (with token)
curl -X POST http://localhost:8000/user/predict-yield \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"country":"India","crop":"wheat",...}'
```

## Performance Considerations

- API calls are async with proper loading states
- Predictions may take 1-2 seconds for model inference
- CSV uploads processed in background (non-blocking)
- Reports cached to reduce database queries

## Security Checklist

✓ Passwords never sent in plain text (HTTPS in production)
✓ JWT tokens stored securely in localStorage
✓ API validates all inputs on backend
✓ CORS restricted to allowed origins
✓ All queries use parameterized statements (SQLAlchemy)
✓ Audit logging for sensitive operations

## Troubleshooting Integration

### "Cannot POST /auth/login"
- Backend not running
- Check `VITE_API_URL` matches backend

### "Invalid token" error
- Token expired (user needs to login again)
- Token corrupted in localStorage
- Clear localStorage and retry

### Prediction returns error
- Ensure all required fields are provided
- Check field ranges (temperature, rainfall, etc.)
- Verify active model exists in backend

### CSV upload fails
- File must be valid CSV format
- Headers must match expected schema
- File size must be under 100 MB

## Future Integration Points

- Real-time updates via WebSockets for processing status
- Model versioning and selection UI
- Advanced filtering and search
- Export predictions to PDF/Excel
- Scheduled batch predictions
