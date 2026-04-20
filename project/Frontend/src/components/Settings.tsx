import { useState, useEffect } from 'react';
import { Shield, Brain, Activity } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'models'>('models');
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadDashboardData = async () => {
    try {
      const u = await apiClient.getUsers();
      setUsersList(u);
      const m = await apiClient.getModels();
      setModelsList(m);
    } catch (e) { }
  };

  useEffect(() => {
    if (user?.role === 'SUPERUSER') {
      loadDashboardData();
    }
  }, [user]);

  const handleRetrain = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient.triggerRetraining();
      setMessage(res.message);
    } catch (e) {
      setMessage('Retraining failed trigger.');
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    await apiClient.updateUserRole(userId, newRole);
    loadDashboardData();
  };

  const handleToggleState = async (userId: number, currentActive: boolean) => {
    await apiClient.toggleUserActive(userId, !currentActive);
    loadDashboardData();
  };

  const handleActivateModel = async (modelId: number) => {
    await apiClient.activateModel(modelId);
    loadDashboardData();
  };

  if (user?.role !== 'SUPERUSER') {
    return <div className="card"><div className="card-body">Access Denied. You require SUPERUSER constraints to view or manipulate system clusters.</div></div>;
  }

  return (
    <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {message && <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-primary)', padding: '1rem', borderRadius: '4px' }}><Activity size={18}/> {message}</div>}

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          onClick={() => setActiveTab('models')}
          style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'models' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'models' ? 'bold' : 'normal', color: activeTab === 'models' ? 'var(--color-primary)' : 'var(--color-text)' }}>
          <Brain size={18} style={{ display: 'inline', marginRight: '8px' }}/> Algorithm Registry & Performance
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'users' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'users' ? 'bold' : 'normal', color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text)' }}>
          <Shield size={18} style={{ display: 'inline', marginRight: '8px' }}/> RBAC User Management
        </button>
      </div>

      {activeTab === 'models' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Machine Learning Registry</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Track regression performance constraints and pinpoint active inference engines.</p>
            </div>
            <button className="btn btn-primary" onClick={handleRetrain} disabled={loading}>
              {loading ? 'Evaluating...' : 'Force Global Retraining Benchmark'}
            </button>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', background: 'var(--color-surface)' }}>
                  <th style={{ padding: '1rem' }}>Active</th>
                  <th style={{ padding: '1rem' }}>Algorithm</th>
                  <th style={{ padding: '1rem' }}>Version</th>
                  <th style={{ padding: '1rem' }}>R² Score</th>
                  <th style={{ padding: '1rem' }}>RMSE</th>
                  <th style={{ padding: '1rem' }}>MAE</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {modelsList.map(m => (
                  <tr key={m.model_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      {m.active ? <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>ACTIVE</span> : 
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleActivateModel(m.model_id)}>Activate</button>}
                    </td>
                    <td style={{ padding: '1rem' }}>{m.algorithm}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.version}</td>
                    <td style={{ padding: '1rem', color: 'var(--color-success)' }}>{Number(m.r2_score).toFixed(4)}</td>
                    <td style={{ padding: '1rem' }}>{Number(m.rmse).toFixed(4)}</td>
                    <td style={{ padding: '1rem' }}>{Number(m.mae).toFixed(4)}</td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3>RBAC User Matrix</h3>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', background: 'var(--color-surface)' }}>
                  <th style={{ padding: '1rem' }}>User ID</th>
                  <th style={{ padding: '1rem' }}>Username</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{u.user_id}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.username}</td>
                    <td style={{ padding: '1rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <select value={u.role} onChange={e => handleRoleChange(u.user_id, e.target.value)} disabled={u.username === user.username} style={{ padding: '0.2rem' }}>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERUSER">SUPERUSER</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="checkbox" checked={u.active} onChange={() => handleToggleState(u.user_id, u.active)} disabled={u.username === user.username} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
