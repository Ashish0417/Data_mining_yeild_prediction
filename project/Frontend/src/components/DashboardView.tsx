import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PredictionLog } from '../services/api';

type Rule = {
  lift: number;
};

type Cluster = {
  size: number;
  yield_value: number;
};

const cropColors = ['#1e5631', '#40916c', '#52b788', '#95d5b2', '#d8f3dc'];

export default function DashboardView() {
  const { user } = useAuth();
  const [history, setHistory] = useState<PredictionLog[]>([]);
  const [modelCount, setModelCount] = useState(0);
  const [rules, setRules] = useState<Rule[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERUSER';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [predictionHistory, models] = await Promise.all([
          apiClient.getPredictionHistory().catch(() => []),
          apiClient.getUserModels().catch(() => []),
        ]);

        setHistory(Array.isArray(predictionHistory) ? predictionHistory : []);
        setModelCount(Array.isArray(models) ? models.length : 0);

        if (isAdmin) {
          const [kmeans, apriori] = await Promise.all([
            apiClient.getKMeansReport().catch(() => []),
            apiClient.getAprioriReport().catch(() => []),
          ]);
          setClusters(Array.isArray(kmeans) ? kmeans : []);
          setRules(Array.isArray(apriori) ? apriori : []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const avgPredictedYield = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, item) => sum + Number(item.predicted_yield || 0), 0);
    return total / history.length;
  }, [history]);

  const weightedClusterYield = useMemo(() => {
    if (!clusters.length) return 0;
    const totalSize = clusters.reduce((sum, c) => sum + Number(c.size || 0), 0);
    if (!totalSize) return 0;
    const weighted = clusters.reduce(
      (sum, c) => sum + Number(c.yield_value || 0) * Number(c.size || 0),
      0,
    );
    return weighted / totalSize;
  }, [clusters]);

  const bestLift = useMemo(() => {
    if (!rules.length) return 0;
    return Math.max(...rules.map((r) => Number(r.lift || 0)));
  }, [rules]);

  const predictionTrend = useMemo(() => {
    const sorted = [...history].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return ta - tb;
    });

    return sorted.slice(-12).map((item) => ({
      time: new Date(item.timestamp).toLocaleDateString(),
      predicted_yield: Number(item.predicted_yield || 0),
    }));
  }, [history]);

  const cropDistribution = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach((item) => {
      const crop = String(item.inputs_json?.crop || 'Unknown');
      map.set(crop, (map.get(crop) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [history]);

  const recentPredictions = useMemo(
    () => [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5),
    [history],
  );

  if (loading) {
    return <div className="card">Loading dashboard data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && <div className="warning-message">{error}</div>}

      <div className="grid grid-2">
        <div className="stat-box">
          <div className="stat-label">Average Predicted Yield</div>
          <div className="stat-value">{avgPredictedYield.toFixed(2)}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> Based on {history.length} predictions
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Models Available</div>
          <div className="stat-value">{modelCount}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Retrieved from active backend
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">KMeans Weighted Yield</div>
          <div className="stat-value">{isAdmin ? weightedClusterYield.toFixed(2) : 'N/A'}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            {isAdmin ? `From ${clusters.length} clusters` : 'Admin report metric'}
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Best Apriori Lift</div>
          <div className="stat-value">{isAdmin ? bestLift.toFixed(2) : 'N/A'}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            {isAdmin ? `Across ${rules.length} rules` : 'Admin report metric'}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Prediction Trend</h3>
        {predictionTrend.length === 0 ? (
          <p>No prediction history available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" stroke="var(--color-text-secondary)" />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted_yield" stroke="#1e5631" strokeWidth={2} name="Predicted Yield" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-2">
        <div className="chart-container">
          <h3 style={{ marginBottom: '1.5rem' }}>Prediction Crop Distribution</h3>
          {cropDistribution.length === 0 ? (
            <p>No crop distribution data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {cropDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={cropColors[index % cropColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-container">
          <h3 style={{ marginBottom: '1.5rem' }}>Latest 5 Predictions</h3>
          {recentPredictions.length === 0 ? (
            <p>No recent predictions available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={recentPredictions.map((item, idx) => ({
                  index: `P${idx + 1}`,
                  value: Number(item.predicted_yield || 0),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#40916c" name="Predicted Yield" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
