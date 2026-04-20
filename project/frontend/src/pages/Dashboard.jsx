import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PredictionForm from '../components/PredictionForm';
import UploadData from '../components/UploadData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [view, setView] = useState('home');

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
                       <p className="text-sm text-slate-500 leading-relaxed">Identify underlying correlative variables via support/confidence thresholds automatically generated from DB views.</p>
                     </div>
                     <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group cursor-default">
                       <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">🌐</div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Clustering Nodes</h3>
                       <p className="text-sm text-slate-500 leading-relaxed">Real-time Redis-cached KMeans groupings indicating yield-clusters geographically and metrically mapped.</p>
                     </div>
                   </div>
                )}
                {view === 'predict' && <PredictionForm />}
                {view === 'reports' && (role === 'ADMIN' || role === 'SUPERUSER') && <div className="bg-white p-12 text-center rounded-2xl text-slate-500 shadow-sm border border-slate-100">Chart.js implementation ready for Data Mining. Querying /admin/reports/apriori and /admin/reports/kmeans API endpoints.</div>}
                {view === 'upload' && (role === 'ADMIN' || role === 'SUPERUSER') && <UploadData />}
                {view === 'system' && role === 'SUPERUSER' && <div className="bg-white p-12 rounded-2xl shadow-sm border-l-4 border-l-red-500"><h3 className="text-xl font-bold mb-4 text-red-500">Danger Zone</h3><p className="text-slate-500 mb-6">Trigger explicit background ML retraining across warehouse views.</p><button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded transition-colors" onClick={()=>alert('Triggering background job...')}>Retrain XGBoost Matrix</button></div>}
             </div>
         </div>
      </div>
    </div>
  );
}
