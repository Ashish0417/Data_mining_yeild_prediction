import { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/api';
import type { YieldPredictionInput, YieldPredictionOutput } from '../services/api';

type PredictionFormState = {
  country: string;
  crop: string;
  model_id: string;
  year: string;
  avg_temp: string;
  rainfall: string;
  rain_days: string;
  frost_days: string;
  heat_days: string;
  humidity: string;
  sown_area: string;
  production: string;
};

export default function PredictionForm() {
  const [formData, setFormData] = useState<PredictionFormState>({
    country: '',
    crop: 'Maize',
    model_id: '',
    year: String(new Date().getFullYear()),
    avg_temp: '',
    rainfall: '',
    rain_days: '',
    frost_days: '',
    heat_days: '',
    humidity: '',
    sown_area: '',
    production: '',
  });

  const [prediction, setPrediction] = useState<YieldPredictionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  useEffect(() => {
    apiClient.getUserModels().then(models => setAvailableModels(models)).catch(() => { });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPrediction(null);
    setLoading(true);

    try {
      const requiredFields = ['country', 'crop', 'year', 'avg_temp', 'rainfall', 'sown_area', 'production'];
      for (const field of requiredFields) {
        if (!formData[field as keyof PredictionFormState]) {
          setError(`Please fill in ${field}`);
          setLoading(false);
          return;
        }
      }

      const predictionData: YieldPredictionInput = {
        country: formData.country,
        crop: formData.crop,
        model_id: formData.model_id ? parseInt(formData.model_id, 10) : undefined,
        year: parseInt(formData.year, 10),
        avg_temp: parseFloat(formData.avg_temp),
        rainfall: parseFloat(formData.rainfall),
        rain_days: parseInt(formData.rain_days || '0', 10),
        frost_days: parseInt(formData.frost_days || '0', 10),
        heat_days: parseInt(formData.heat_days || '0', 10),
        humidity: parseFloat(formData.humidity || '0'),
        sown_area: parseFloat(formData.sown_area),
        production: parseFloat(formData.production),
      };

      const result = await apiClient.predictYield(predictionData);
      setPrediction(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = ['Maize', 'Oats', 'Rye', 'Barley', 'potatoes', 'Rice'];
  const countryOptions = ['India', 'USA', 'China', 'Hungary', 'Australia', 'France'];

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="card">
        <div className="card-header">
          <h3>Crop Yield Prediction</h3>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(214, 40, 40, 0.1)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            <span style={{ color: 'var(--color-error)' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select a country</option>
              {countryOptions.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Crop Type</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              disabled={loading}
            >
              {cropOptions.map(crop => (
                <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Prediction Target Framework</label>
            <select
              name="model_id"
              value={formData.model_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Auto-Detect Active (Optimal)</option>
              {availableModels
                .filter(model => model.crop_name?.toLowerCase() === formData.crop?.toLowerCase())
                .map(m => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.algorithm} ({m.version}) - R²: {Number(m.r2_score).toFixed(3)} {m.active ? "★" : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max="2100"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Average Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              name="avg_temp"
              value={formData.avg_temp}
              onChange={handleChange}
              placeholder="e.g., 22.5"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Annual Rainfall (mm)</label>
            <input
              type="number"
              step="1"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              placeholder="e.g., 1200"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Rainy Days</label>
            <input
              type="number"
              name="rain_days"
              value={formData.rain_days}
              onChange={handleChange}
              placeholder="e.g., 120"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Frost Days</label>
            <input
              type="number"
              name="frost_days"
              value={formData.frost_days}
              onChange={handleChange}
              placeholder="e.g., 30"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Heat Days</label>
            <input
              type="number"
              name="heat_days"
              value={formData.heat_days}
              onChange={handleChange}
              placeholder="e.g., 50"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Humidity (%)</label>
            <input
              type="number"
              step="0.1"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="e.g., 65"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Sown Area (hectares)</label>
            <input
              type="number"
              step="0.1"
              name="sown_area"
              value={formData.sown_area}
              onChange={handleChange}
              placeholder="e.g., 100"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Production Amount</label>
            <input
              type="number"
              step="0.1"
              name="production"
              value={formData.production}
              onChange={handleChange}
              placeholder="e.g., 500"
              disabled={loading}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Send size={18} />
              {loading ? 'Predicting...' : 'Get Prediction'}
            </button>
          </div>
        </form>
      </div>

      {prediction && (
        <div className="card" style={{ marginTop: '1.5rem', background: 'rgba(82, 183, 136, 0.05)', borderColor: 'var(--color-success)' }}>
          <div className="card-header" style={{ borderBottomColor: 'var(--color-success)' }}>
            <h3 style={{ color: 'var(--color-success)' }}>Prediction Results</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Predicted Yield</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '600', color: 'var(--color-success)' }}>
                {prediction.predicted_yield.toFixed(2)} kg/ha
              </p>
            </div>

            <div>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Production Estimate</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '600', color: 'var(--color-success)' }}>
                {prediction.production_estimate.toFixed(0)} kg
              </p>
            </div>

            {prediction.shap_explaination && (
              <div>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Feature Importance (SHAP)</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                  Model explanation available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
