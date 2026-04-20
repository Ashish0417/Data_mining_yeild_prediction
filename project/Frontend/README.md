# CropYield - Crop Yield Prediction Platform

A modern, production-grade web application for agricultural data analysis and crop yield prediction using machine learning with SHAP explainability.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Crop Yield Prediction**: Make predictions using advanced ML models with SHAP explainability
- **Data Upload**: Batch import agricultural data via CSV files with background ETL processing
- **Analytics Dashboard**: View key metrics and historical predictions
- **User Management**: Profile settings and account management
- **Admin Tools**: Data processing, reporting, and K-means clustering analysis

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and HMR
- React Router for navigation
- Axios for API calls
- Recharts for data visualization
- Lucide React for icons
- CSS variables for theming

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL/MySQL database
- JWT authentication
- Redis caching
- Scikit-learn ML models
- SHAP for model explainability
- Pandas for data processing

## Quick Start

### Prerequisites
- Node.js 16+ and pnpm
- Backend API running on `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Configuration**
   Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   Frontend runs on `http://localhost:5173`

## API Integration

The frontend integrates with these backend endpoints:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (OAuth2 form data)

### User Operations
- `POST /user/predict-yield` - Make crop yield prediction
- `GET /user/my-predictions` - Get user's prediction history

### Admin Operations
- `POST /admin/bulk-upload` - Upload CSV file for batch processing
- `GET /admin/reports/kmeans` - Get K-means clustering report
- `GET /admin/reports/apriori` - Get association rules report

### Health
- `GET /health` - API health check

## Project Structure

```
src/
├── components/              # React components
│   ├── DashboardView.tsx    # Dashboard metrics and charts
│   ├── DashboardContent.tsx # Content switcher
│   ├── PredictionForm.tsx   # Crop yield prediction form
│   ├── UploadData.tsx       # CSV file upload
│   ├── Settings.tsx         # User settings
│   └── Sidebar.tsx          # Navigation sidebar
├── pages/                   # Page components
│   ├── Login.tsx            # Login page
│   ├── Register.tsx         # Registration page
│   └── Dashboard.tsx        # Main dashboard layout
├── services/
│   └── api.ts              # API client with all endpoints
├── context/
│   └── AuthContext.tsx     # Authentication context provider
├── App.tsx                 # Main app with routing
├── App.css                 # Component styles
├── index.css               # Global styles
└── main.tsx                # Entry point
```

## Prediction Data Format

When making predictions, send data matching the backend schema:

```typescript
{
  country: "India",
  crop: "wheat",
  year: 2024,
  avg_temp: 22.5,           // Average temperature in °C
  rainfall: 1200,           // Annual rainfall in mm
  rain_days: 120,           // Number of rainy days
  frost_days: 30,           // Number of frost days
  heat_days: 50,            // Number of heat days
  humidity: 65,             // Humidity percentage
  sown_area: 100            // Area sown in hectares
}
```

Response includes predicted yield (kg/ha), production estimate (kg), and SHAP explanations.

## CSV Upload Format

Download the template from the app or use this format:

```
country,crop,year,avg_temp,rainfall,rain_days,frost_days,heat_days,humidity,sown_area
India,wheat,2024,22.5,1200,120,30,50,65,100
USA,corn,2024,20.0,800,100,20,40,70,150
```

## Authentication Flow

1. User registers with username, email, password
2. Password is hashed with bcrypt
3. First user becomes SUPERUSER, others become USER
4. Login returns JWT token
5. Token stored in localStorage and sent in all API requests
6. Protected routes redirect unauthenticated users to login

## Available Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm type-check # Type checking with tsc
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

## Styling

The app uses CSS variables for theming:

```css
--color-primary: #1e5631        /* Agricultural green */
--color-success: #52b788
--color-error: #d62828
--color-warning: #f77f00
--color-background: #ffffff
--color-text: #1a1a1a
```

Modify `src/index.css` to customize colors globally.

## Troubleshooting

### CORS Errors
- Backend must have CORS enabled
- Check `VITE_API_URL` matches backend origin

### Login Fails
- Verify backend is running
- Check username/password are correct
- Ensure database tables exist

### Predictions Not Working
- Confirm active ML model exists in backend
- Check all required fields are filled
- Review backend logs for model loading errors

## Performance Tips

- API responses cached with 1-hour TTL in Redis
- Lazy-load dashboard components
- Use browser DevTools to check bundle size
- Enable gzip compression in production

## Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- HTTPS recommended in production
- CORS configured for trusted origins only
- SQL injection prevented via SQLAlchemy ORM

## Building for Production

```bash
pnpm build
```

Output in `dist/` directory ready for deployment.

## Deployment

### Vercel
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

## Contributing

1. Create feature branch from main
2. Make changes with descriptive commits
3. Ensure TypeScript compilation passes
4. Submit PR with detailed description

## License

MIT License
