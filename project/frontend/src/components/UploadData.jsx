import { useState } from 'react';
import api from '../api';

export default function UploadData() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('Uploading and triggering ETL pipeline...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/admin/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus(res.data.message || 'Upload successful. ETL is processing data in the background.');
    } catch(err) {
      setStatus('Error during upload. Ensure you have admin rights and the file is a valid CSV.');
    }
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 xl:max-w-3xl">
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-800">Bulk Data Ingestion</h2>
         <p className="text-slate-500 text-sm mt-1">Upload historical CSV datasets to populate the Snowflake warehouse and train Machine Learning models.</p>
      </div>
      <form onSubmit={handleUpload} className="flex flex-col gap-6">
        <div className="border-2 border-dashed border-emerald-300 rounded-xl p-10 text-center bg-emerald-50 hover:bg-emerald-100 transition-colors">
           <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={e => setFile(e.target.files[0])} />
           <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <svg className="w-12 h-12 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <span className="text-emerald-700 font-bold text-lg">{file ? file.name : 'Click to Browse for CSV File'}</span>
              <span className="text-emerald-600/70 text-sm mt-2">Must be a .csv file containing maize metrics</span>
           </label>
        </div>
        <button type="submit" disabled={!file} className={`py-4 rounded-xl font-bold tracking-wide transition-all shadow-md ${file ? 'bg-slate-900 hover:bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          Execute ETL Pipeline
        </button>
      </form>
      {status && (
         <div className="mt-6 p-4 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold text-center animate-fade-in">
            {status}
         </div>
      )}
    </div>
  );
}
