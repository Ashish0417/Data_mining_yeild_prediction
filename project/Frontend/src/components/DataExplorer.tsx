import { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DataExplorer() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;
  
  const [filters, setFilters] = useState({ country: '', crop: '', year: '' });

  const loadData = async () => {
    try {
      const safeFilters: any = {};
      if (filters.country) safeFilters.country = filters.country;
      if (filters.crop) safeFilters.crop = filters.crop;
      if (filters.year) safeFilters.year = parseInt(filters.year);

      const res = await apiClient.getExplorerData(skip, limit, safeFilters);
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [skip]);

  const handleSearch = () => {
    setSkip(0);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to logically archive (soft-delete) this record? This avoids violating constraints.')) return;
    try {
      await apiClient.deleteFactData(id);
      loadData();
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3>Data Explorer</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Browse and manage warehouse entries ({total} total)</p>
          </div>
        </div>
        
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input type="text" placeholder="Filter Country" value={filters.country} onChange={e => setFilters({...filters, country: e.target.value})} className="form-control" />
            <input type="text" placeholder="Filter Crop" value={filters.crop} onChange={e => setFilters({...filters, crop: e.target.value})} className="form-control" />
            <input type="number" placeholder="Filter Year" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="form-control" />
            <button className="btn btn-primary" onClick={handleSearch}><Search size={18} /> Search</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Location</th>
                  <th style={{ padding: '1rem' }}>Crop</th>
                  <th style={{ padding: '1rem' }}>Year</th>
                  <th style={{ padding: '1rem' }}>Area Sown</th>
                  <th style={{ padding: '1rem' }}>Production</th>
                  <th style={{ padding: '1rem' }}>Yield Computed</th>
                  {user?.role === 'SUPERUSER' && <th style={{ padding: '1rem' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.fact_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{row.fact_id}</td>
                    <td style={{ padding: '1rem' }}>{row.country}</td>
                    <td style={{ padding: '1rem' }}>{row.crop}</td>
                    <td style={{ padding: '1rem' }}>{row.year}</td>
                    <td style={{ padding: '1rem' }}>{row.sown_area}</td>
                    <td style={{ padding: '1rem' }}>{row.production}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.yield_value.toFixed(4)}</td>
                    {user?.role === 'SUPERUSER' && (
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleDelete(row.fact_id)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" disabled={skip === 0} onClick={() => setSkip(skip - limit)}>Previous Match</button>
            <span>Showing {skip + 1} - {Math.min(skip + limit, total)} of {total}</span>
            <button className="btn btn-secondary" disabled={skip + limit >= total} onClick={() => setSkip(skip + limit)}>Next Match</button>
          </div>
        </div>
      </div>
    </div>
  );
}
