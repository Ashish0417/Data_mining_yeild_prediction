import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PredictionForm from '../components/PredictionForm';
import UploadData from '../components/UploadData';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [view, setView] = useState('home');
  const [kmeansData, setKmeansData] = useState([]);
  const [aprioriData, setAprioriData] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const isAdmin = role === 'ADMIN' || role === 'SUPERUSER';

  const loadReports = async () => {
    if (!isAdmin) return;
    setLoadingReports(true);
    setReportsError('');
    try {
      const [kmeansRes, aprioriRes] = await Promise.all([
        api.get('/admin/reports/kmeans'),
        api.get('/admin/reports/apriori'),
      ]);
      setKmeansData(Array.isArray(kmeansRes.data) ? kmeansRes.data : []);
      setAprioriData(Array.isArray(aprioriRes.data) ? aprioriRes.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setReportsError(err?.response?.data?.detail || 'Failed to load reports data.');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (!token) {
      navigate('/login');
    } else {
      setRole(r);
    }

    const navListener = (e) => setView(e.detail);
    window.addEventListener('nav', navListener);
    return () => window.removeEventListener('nav', navListener);
  }, [navigate]);

  useEffect(() => {
    if (view === 'reports' && isAdmin) {
      loadReports();
    }
  }, [view, isAdmin]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar role={role} />
      <div className="flex-1 overflow-y-auto w-full relative">
         <div className="absolute top-0 right-0 p-8 w-full h-[30vh] bg-gradient-to-r from-emerald-100/50 to-transparent -z-10" />
         <div className="px-10 py-12 max-w-7xl mx-auto">
             <header className="mb-12 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Welcome back, {localStorage.getItem('username')}</h1>
                  <p className="text-slate-500 mt-2 font-medium">Manage your metrics and intelligent agricultural insights.</p>
                </div>
                <div className="bg-white px-5 py-2 rounded-full shadow-sm border border-emerald-100 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="font-bold text-emerald-800 text-sm tracking-wide">Role: {role}</span>
                </div>
             </header>
             
             <div className="animate-fade-in transition-all">
                {view === 'home' && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group cursor-default">
                       <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">🌿</div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Predictive Pipeline</h3>
                       <p className="text-sm text-slate-500 leading-relaxed">Leverage XGBoost and Random Forest logic to model climate data synchronously into actionable yield forecasts.</p>
                     </div>
                     <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group cursor-default">
                       <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">📊</div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Apriori Analysis</h3>
                       <p className="text-sm text-slate-500 leading-relaxed">
                         {isAdmin
                           ? `Association rules available: ${aprioriData.length}`
                           : 'Association rule insights are available to admin users in Reports.'}
                       </p>
                     </div>
                     <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group cursor-default">
                       <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">🌐</div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Clustering Nodes</h3>
                       <p className="text-sm text-slate-500 leading-relaxed">
                         {isAdmin
                           ? `KMeans clusters available: ${kmeansData.length}`
                           : 'KMeans clustering summaries are available to admin users in Reports.'}
                       </p>
                     </div>
                   </div>
                )}
                {view === 'predict' && <PredictionForm />}
                {view === 'reports' && isAdmin && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Data Mining Reports</h3>
                        <p className="text-sm text-slate-500">
                          Live data from backend endpoints for KMeans clusters and Apriori association rules.
                        </p>
                        {lastUpdated && (
                          <p className="text-xs text-slate-400 mt-1">Last updated: {lastUpdated.toLocaleString()}</p>
                        )}
                      </div>
                      <button
                        onClick={loadReports}
                        disabled={loadingReports}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
                      >
                        {loadingReports ? 'Refreshing...' : 'Refresh Reports'}
                      </button>
                    </div>

                    {reportsError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                        {reportsError}
                      </div>
                    )}

                    {loadingReports && (
                      <div className="bg-white p-10 text-center rounded-2xl text-slate-500 shadow-sm border border-slate-100">
                        Loading reports data...
                      </div>
                    )}

                    {!loadingReports && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-1">KMeans Summary</h4>
                            <p className="text-sm text-slate-500">Total clusters: {kmeansData.length}</p>
                          </div>
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-1">Apriori Summary</h4>
                            <p className="text-sm text-slate-500">Total rules: {aprioriData.length}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
                          <h4 className="text-lg font-bold text-slate-800 mb-4">KMeans Clusters</h4>
                          {kmeansData.length === 0 ? (
                            <p className="text-sm text-slate-500">No KMeans clusters returned by backend.</p>
                          ) : (
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                  <th className="py-2 pr-4">Cluster ID</th>
                                  <th className="py-2 pr-4">Avg Temp</th>
                                  <th className="py-2 pr-4">Rainfall</th>
                                  <th className="py-2 pr-4">Yield Value</th>
                                  <th className="py-2 pr-4">Size</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kmeansData.map((row, idx) => (
                                  <tr key={`${row.cluster_id}-${idx}`} className="border-b border-slate-50 last:border-0 text-slate-700">
                                    <td className="py-2 pr-4">{row.cluster_id}</td>
                                    <td className="py-2 pr-4">{Number(row.avg_temp).toFixed(2)}</td>
                                    <td className="py-2 pr-4">{Number(row.rainfall).toFixed(2)}</td>
                                    <td className="py-2 pr-4">{Number(row.yield_value).toFixed(2)}</td>
                                    <td className="py-2 pr-4">{row.size}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
                          <h4 className="text-lg font-bold text-slate-800 mb-4">Apriori Rules</h4>
                          {aprioriData.length === 0 ? (
                            <p className="text-sm text-slate-500">No Apriori rules returned by backend.</p>
                          ) : (
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                  <th className="py-2 pr-4">Antecedents</th>
                                  <th className="py-2 pr-4">Consequents</th>
                                  <th className="py-2 pr-4">Support</th>
                                  <th className="py-2 pr-4">Confidence</th>
                                  <th className="py-2 pr-4">Lift</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aprioriData.map((row, idx) => (
                                  <tr key={idx} className="border-b border-slate-50 last:border-0 text-slate-700">
                                    <td className="py-2 pr-4">{Array.isArray(row.antecedents) ? row.antecedents.join(', ') : '-'}</td>
                                    <td className="py-2 pr-4">{Array.isArray(row.consequents) ? row.consequents.join(', ') : '-'}</td>
                                    <td className="py-2 pr-4">{Number(row.support).toFixed(3)}</td>
                                    <td className="py-2 pr-4">{Number(row.confidence).toFixed(3)}</td>
                                    <td className="py-2 pr-4">{Number(row.lift).toFixed(3)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {view === 'reports' && !isAdmin && (
                  <div className="bg-white p-12 text-center rounded-2xl text-slate-500 shadow-sm border border-slate-100">
                    Reports are available only for admin and superuser roles.
                  </div>
                )}
                {view === 'upload' && (role === 'ADMIN' || role === 'SUPERUSER') && <UploadData />}
                {view === 'system' && role === 'SUPERUSER' && <div className="bg-white p-12 rounded-2xl shadow-sm border-l-4 border-l-red-500"><h3 className="text-xl font-bold mb-4 text-red-500">Danger Zone</h3><p className="text-slate-500 mb-6">Trigger explicit background ML retraining across warehouse views.</p><button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded transition-colors" onClick={()=>alert('Triggering background job...')}>Retrain XGBoost Matrix</button></div>}
             </div>
         </div>
      </div>
    </div>
  );
}
