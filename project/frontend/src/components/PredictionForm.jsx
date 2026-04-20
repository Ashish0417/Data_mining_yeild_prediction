import { useState } from 'react';
import api from '../api';

export default function PredictionForm() {
  const [form, setForm] = useState({
    country: '', crop: '', year: 2026, avg_temp: 25.5, rainfall: 1500, rain_days: 100, frost_days: 0, heat_days: 5, humidity: 60, sown_area: 100
  });
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/user/predict-yield', form);
      setResult(res.data);
    } catch(err) {
      alert("Prediction failed. Ensure you are logged in and models are trained.");
    }
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 xl:max-w-4xl">
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-800">Inference Predictor</h2>
         <p className="text-slate-500 text-sm mt-1">Populate input matrices for model extraction & yield anticipation.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Location Context</label><input required placeholder="Country Name" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} /></div>
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Crop Descriptor</label><input required placeholder="Crop Name" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800" value={form.crop} onChange={e=>setForm({...form, crop:e.target.value})} /></div>
        
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Avg Temperature (°C)</label><input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={form.avg_temp} onChange={e=>setForm({...form, avg_temp:parseFloat(e.target.value)})} /></div>
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Annual Rainfall (mm)</label><input type="number" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={form.rainfall} onChange={e=>setForm({...form, rainfall:parseFloat(e.target.value)})} /></div>
        
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Rain Days</label><input type="number" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={form.rain_days} onChange={e=>setForm({...form, rain_days:parseInt(e.target.value)})} /></div>
        <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Humidity (%)</label><input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={form.humidity} onChange={e=>setForm({...form, humidity:parseFloat(e.target.value)})} /></div>
        
        <div className="md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Total Sown Area (Hectares)</label><input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-lg font-bold text-slate-700" value={form.sown_area} onChange={e=>setForm({...form, sown_area:parseFloat(e.target.value)})} /></div>
        
        <button type="submit" className="md:col-span-2 bg-slate-900 text-white font-bold tracking-wide py-4 mt-2 rounded-xl hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
           Execute Cloud Inference
        </button>
      </form>
      
      {result && (
         <div className="mt-10 p-8 bg-gradient-to-br from-emerald-50/50 to-teal-100/50 rounded-2xl border border-emerald-100/50 shadow-sm animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest mb-6">Yield Computation Established</h3>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="bg-white/80 p-5 rounded-xl border border-emerald-100 backdrop-blur-sm flex-1">
                   <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Predicted Factor</p>
                   <p className="text-4xl font-black text-emerald-600 drop-shadow-sm">{result.predicted_yield.toFixed(4)} <span className="text-sm text-emerald-800 font-medium tracking-normal">units/HA</span></p>
                </div>
                <div className="bg-white/80 p-5 rounded-xl border border-emerald-100 backdrop-blur-sm flex-1">
                   <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Estimated Net Production</p>
                   <p className="text-4xl font-black text-emerald-600 drop-shadow-sm">{result.production_estimate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm text-emerald-800 font-medium tracking-normal">Total</span></p>
                </div>
            </div>
            {result.shap_explaination && (
               <div className="mt-8">
                 <p className="text-xs uppercase font-bold text-slate-400 mb-2">SHAP Values Output (Tree Vectors):</p>
                 <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-700 shadow-inner">
                    <pre className="text-xs text-emerald-400 font-mono tracking-tight">{JSON.stringify(result.shap_explaination, null, 2).slice(0,400)}...</pre>
                 </div>
               </div>
            )}
         </div>
      )}
    </div>
  );
}
