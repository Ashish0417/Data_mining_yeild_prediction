import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

type KMeansCluster = {
  cluster_id: number;
  avg_temp: number;
  rainfall: number;
  yield_value: number;
  size: number;
};

type AprioriRule = {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
};

export default function ReportsView() {
  const { user } = useAuth();
  const [kmeansData, setKmeansData] = useState<KMeansCluster[]>([]);
  const [aprioriData, setAprioriData] = useState<AprioriRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERUSER';

  const loadReports = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const [kmeans, apriori] = await Promise.all([
        apiClient.getKMeansReport(),
        apiClient.getAprioriReport(),
      ]);
      setKmeansData(Array.isArray(kmeans) ? kmeans : []);
      setAprioriData(Array.isArray(apriori) ? apriori : []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const kmeansBarData = useMemo(
    () =>
      kmeansData.map((item) => ({
        cluster: `C${item.cluster_id}`,
        size: item.size,
      })),
    [kmeansData],
  );

  const aprioriStrengthData = useMemo(
    () =>
      aprioriData.slice(0, 10).map((rule, idx) => ({
        rule: `R${idx + 1}`,
        strength: Number((rule.lift * rule.confidence).toFixed(3)),
        lift: Number(rule.lift.toFixed(3)),
      })),
    [aprioriData],
  );

  if (!isAdmin) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Data Mining Reports</h3>
        </div>
        <p>Reports are available only to ADMIN and SUPERUSER roles.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h3>Data Mining Reports</h3>
          <button className="btn btn-primary btn-small" onClick={loadReports} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p style={{ marginTop: '0.75rem' }}>
          Live backend reports from /admin/reports/kmeans and /admin/reports/apriori.
        </p>
        {lastUpdated && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
        {error && <p className="error-message" style={{ marginTop: '0.75rem' }}>{error}</p>}
      </div>

      {!loading && (
        <>
          <div className="grid grid-2">
            <div className="stat-box">
              <div className="stat-label">KMeans Clusters</div>
              <div className="stat-value">{kmeansData.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Apriori Rules</div>
              <div className="stat-value">{aprioriData.length}</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="chart-container">
              <h3 style={{ marginBottom: '1rem' }}>KMeans Cluster Size (Bar)</h3>
              {kmeansBarData.length === 0 ? (
                <p>No KMeans data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={kmeansBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="cluster" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="size" fill="#1e5631" name="Cluster Size" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-container">
              <h3 style={{ marginBottom: '1rem' }}>KMeans Rainfall vs Yield (Scatter)</h3>
              {kmeansData.length === 0 ? (
                <p>No KMeans data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" dataKey="rainfall" name="Rainfall" unit=" mm" />
                    <YAxis type="number" dataKey="yield_value" name="Yield" unit=" kg/ha" />
                    <ZAxis type="number" dataKey="size" range={[80, 280]} name="Cluster Size" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={kmeansData} fill="#40916c" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-container">
            <h3 style={{ marginBottom: '1rem' }}>Apriori Rule Strength (Lift x Confidence)</h3>
            {aprioriStrengthData.length === 0 ? (
              <p>No Apriori rules available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aprioriStrengthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="rule" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="strength" fill="#52b788" name="Strength" />
                  <Bar dataKey="lift" fill="#1e5631" name="Lift" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-container" style={{ overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>KMeans Clusters Table</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Avg Temp</th>
                  <th>Rainfall</th>
                  <th>Yield Value</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {kmeansData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No KMeans cluster data available.</td>
                  </tr>
                ) : (
                  kmeansData.map((row) => (
                    <tr key={row.cluster_id}>
                      <td>{row.cluster_id}</td>
                      <td>{Number(row.avg_temp).toFixed(2)}</td>
                      <td>{Number(row.rainfall).toFixed(2)}</td>
                      <td>{Number(row.yield_value).toFixed(2)}</td>
                      <td>{row.size}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="chart-container" style={{ overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Apriori Rules Table</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Antecedents</th>
                  <th>Consequents</th>
                  <th>Support</th>
                  <th>Confidence</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                {aprioriData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No Apriori rule data available.</td>
                  </tr>
                ) : (
                  aprioriData.map((row, idx) => (
                    <tr key={`${idx}-${row.lift}`}>
                      <td>{Array.isArray(row.antecedents) ? row.antecedents.join(', ') : '-'}</td>
                      <td>{Array.isArray(row.consequents) ? row.consequents.join(', ') : '-'}</td>
                      <td>{Number(row.support).toFixed(3)}</td>
                      <td>{Number(row.confidence).toFixed(3)}</td>
                      <td>{Number(row.lift).toFixed(3)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
