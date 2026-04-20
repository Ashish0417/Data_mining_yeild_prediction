import { BarChart3, Upload, PieChart, Settings, LogOut, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'predict', label: 'Make Prediction', icon: PieChart },
    ...(user?.role === 'ADMIN' || user?.role === 'SUPERUSER' 
      ? [{ id: 'explorer', label: 'Data Explorer', icon: Database }] 
      : []),
    ...(user?.role === 'ADMIN' || user?.role === 'SUPERUSER' 
      ? [{ id: 'upload', label: 'Upload Data', icon: Upload }] 
      : []),
    ...(user?.role === 'SUPERUSER' 
      ? [{ id: 'settings', label: 'Settings', icon: Settings }] 
      : []),
  ];

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🌾</span>
          CropYield
        </h1>
      </div>

      <div className="sidebar-nav">
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTab(item.id);
                }
              }}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
