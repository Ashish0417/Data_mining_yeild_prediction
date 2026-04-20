import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Activity, Database } from 'lucide-react';
import { apiClient } from '../services/api';



export default function UploadData() {
  const [activeTab, setActiveTab] = useState<'bulk' | 'single'>('bulk');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [metadata, setMetadata] = useState({ country: '', state: '', district: '', region: '', crop: '' });
  const [mappingStr, setMappingStr] = useState('{\n  "TempAvg": "avg_temp",\n  "Rain(mm)": "rainfall",\n  "Area_Ha": "sown_area"\n}');
  
  const [singleForm, setSingleForm] = useState({
    country: '', state: '', district: '', region: '', crop: '', year: 2024,
    avg_temp: 20.0, rainfall: 800, rain_days: 0, frost_days: 0, heat_days: 0, humidity: 0,
    sown_area: 100, production: 500
  });

  const handleBulkSubmit = async () => {
    if (!selectedFile) return setError('Select a file.');
    if (!metadata.country || !metadata.crop) return setError('Country and Crop are mandatory.');
    
    setUploading(true);
    setError(''); setSuccessMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('country', metadata.country);
      formData.append('crop', metadata.crop);
      if (metadata.state) formData.append('state', metadata.state);
      if (metadata.district) formData.append('district', metadata.district);
      if (metadata.region) formData.append('region', metadata.region);
      try {
        JSON.parse(mappingStr);
        formData.append('column_mapping', mappingStr);
      } catch (e) {
        throw new Error('Invalid JSON format for Column Mapping');
      }
      
      const res = await apiClient.uploadCsvFile(formData);
      setSuccessMessage(res.message);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSingleSubmit = async () => {
    if (!singleForm.country || !singleForm.crop) return setError('Country and Crop are mandatory.');
    setUploading(true);
    try {
      const res = await apiClient.insertSingleData(singleForm);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Single entry failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <button 
            onClick={() => setActiveTab('bulk')}
            style={{ 
              background: 'none', border: 'none', padding: '1rem', cursor: 'pointer',
              borderBottom: activeTab === 'bulk' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: activeTab === 'bulk' ? 'bold' : 'normal',
              color: activeTab === 'bulk' ? 'var(--color-primary)' : 'var(--color-text)'
            }}>
            <Database size={16} style={{ display: 'inline', marginRight: '8px' }}/>
            Bulk CSV Upload
          </button>
          <button 
            onClick={() => setActiveTab('single')}
            style={{ 
              background: 'none', border: 'none', padding: '1rem', cursor: 'pointer',
              borderBottom: activeTab === 'single' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: activeTab === 'single' ? 'bold' : 'normal',
              color: activeTab === 'single' ? 'var(--color-primary)' : 'var(--color-text)'
            }}>
            <Activity size={16} style={{ display: 'inline', marginRight: '8px' }}/>
            Manual Single Entry
          </button>
        </div>

        <div className="card-body" style={{ padding: '2rem' }}>
          {error && <div style={{ color: 'var(--color-error)', background: 'rgba(214,40,40,0.1)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
          {successMessage && <div style={{ color: 'var(--color-success)', background: 'rgba(82,183,136,0.1)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}><CheckCircle size={16} /> {successMessage}</div>}

          {activeTab === 'bulk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid">
                <div className="form-group">
                  <label>Country *</label>
                  <input type="text" value={metadata.country} onChange={e => setMetadata({...metadata, country: e.target.value})} placeholder="e.g. Hungary" />
                </div>
                <div className="form-group">
                  <label>Crop Name *</label>
                  <input type="text" value={metadata.crop} onChange={e => setMetadata({...metadata, crop: e.target.value})} placeholder="e.g. Maize" />
                </div>
                <div className="form-group"><label>State (Optional)</label><input type="text" value={metadata.state} onChange={e => setMetadata({...metadata, state: e.target.value})} /></div>
                <div className="form-group"><label>District (Optional)</label><input type="text" value={metadata.district} onChange={e => setMetadata({...metadata, district: e.target.value})} /></div>
              </div>

              <div className="form-group">
                <label>Column Mappings JSON (Optional)</label>
                <textarea rows={4} value={mappingStr} onChange={e => setMappingStr(e.target.value)} style={{ fontFamily: 'monospace' }} />
                <small style={{ color: 'var(--color-text-secondary)' }}>Dynamically maps CSV headers to expected schema variables (rainfall, avg_temp, sown_area).</small>
              </div>

              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ border: '2px dashed var(--color-border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius)' }}>
                  <Upload size={32} style={{ color: 'var(--color-primary)' }}/>
                  <h4>{selectedFile ? selectedFile.name : 'Click to select CSV File'}</h4>
                </div>
                <input id="file-input" type="file" accept=".csv" onChange={(e) => { if(e.target.files?.length) setSelectedFile(e.target.files[0]) }} style={{ display: 'none' }} />
              </label>

              <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={uploading}>
                {uploading ? 'Processing...' : 'Upload Data Warehouse Batch'}
              </button>
            </div>
          )}

          {activeTab === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid">
                <div className="form-group"><label>Country *</label><input type="text" value={singleForm.country} onChange={e => setSingleForm({...singleForm, country: e.target.value})} /></div>
                <div className="form-group"><label>Crop Name *</label><input type="text" value={singleForm.crop} onChange={e => setSingleForm({...singleForm, crop: e.target.value})} /></div>
                <div className="form-group"><label>Year</label><input type="number" value={singleForm.year} onChange={e => setSingleForm({...singleForm, year: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Area Sown (Ha)</label><input type="number" value={singleForm.sown_area} onChange={e => setSingleForm({...singleForm, sown_area: parseFloat(e.target.value)})} /></div>
                <div className="form-group"><label>Production (Tonnes)</label><input type="number" value={singleForm.production} onChange={e => setSingleForm({...singleForm, production: parseFloat(e.target.value)})} /></div>
                <div className="form-group"><label>Avg Temp (°C)</label><input type="number" step="0.1" value={singleForm.avg_temp} onChange={e => setSingleForm({...singleForm, avg_temp: parseFloat(e.target.value)})} /></div>
                <div className="form-group"><label>Rainfall (mm)</label><input type="number" step="0.1" value={singleForm.rainfall} onChange={e => setSingleForm({...singleForm, rainfall: parseFloat(e.target.value)})} /></div>
              </div>
              <button className="btn btn-primary" onClick={handleSingleSubmit} disabled={uploading}>
                {uploading ? 'Processing...' : 'Insert Row'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
