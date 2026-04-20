import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const yieldData = [
  { month: 'Jan', yield: 4200, target: 4000 },
  { month: 'Feb', yield: 4500, target: 4200 },
  { month: 'Mar', yield: 4800, target: 4400 },
  { month: 'Apr', yield: 5200, target: 4600 },
  { month: 'May', yield: 5500, target: 4800 },
  { month: 'Jun', yield: 5900, target: 5000 },
];

const cropData = [
  { name: 'Wheat', value: 35, fill: '#1e5631' },
  { name: 'Corn', value: 30, fill: '#40916c' },
  { name: 'Soybeans', value: 20, fill: '#52b788' },
  { name: 'Others', value: 15, fill: '#d4f1d4' },
];

const weatherData = [
  { week: 'Week 1', temp: 18, humidity: 65, rainfall: 25 },
  { week: 'Week 2', temp: 20, humidity: 60, rainfall: 30 },
  { week: 'Week 3', temp: 22, humidity: 55, rainfall: 15 },
  { week: 'Week 4', temp: 21, humidity: 58, rainfall: 40 },
];

export default function DashboardView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats */}
      <div className="grid grid-2">
        <div className="stat-box">
          <div className="stat-label">Average Yield</div>
          <div className="stat-value">5,167 kg/ha</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> +8.2% from last month
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Total Area Monitored</div>
          <div className="stat-value">2,450 ha</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Across 12 fields
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Weather Status</div>
          <div className="stat-value">Optimal</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Conditions favorable
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Prediction Accuracy</div>
          <div className="stat-value">94.2%</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Based on 50 predictions
          </div>
        </div>
      </div>

      {/* Yield Trend */}
      <div className="chart-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Yield Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yieldData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-text-secondary)" />
            <YAxis stroke="var(--color-text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="yield" stroke="#1e5631" strokeWidth={2} name="Actual Yield" />
            <Line type="monotone" dataKey="target" stroke="#40916c" strokeWidth={2} strokeDasharray="5 5" name="Target" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Crop Distribution & Weather */}
      <div className="grid grid-2">
        <div className="chart-container">
          <h3 style={{ marginBottom: '1.5rem' }}>Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cropData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {cropData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 style={{ marginBottom: '1.5rem' }}>Weekly Weather Data</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" stroke="var(--color-text-secondary)" />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend />
              <Bar dataKey="temp" fill="#1e5631" name="Temp (°C)" />
              <Bar dataKey="humidity" fill="#40916c" name="Humidity (%)" />
              <Bar dataKey="rainfall" fill="#52b788" name="Rainfall (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="chart-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Recent Activities</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { time: 'Today, 2:30 PM', action: 'Uploaded new field data', status: 'completed' },
            { time: 'Yesterday, 10:15 AM', action: 'Generated yield prediction', status: 'completed' },
            { time: 'Yesterday, 8:45 AM', action: 'Weather alert: High humidity', status: 'alert' },
            { time: '2 days ago, 3:20 PM', action: 'Field monitoring update', status: 'completed' },
            { time: '3 days ago, 1:10 PM', action: 'Data validation completed', status: 'completed' },
          ].map((activity, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              borderLeft: `4px solid ${activity.status === 'alert' ? 'var(--color-warning)' : 'var(--color-success)'}`,
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{activity.action}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{activity.time}</div>
              </div>
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
                fontWeight: '500',
                background: activity.status === 'alert' ? 'rgba(247, 127, 0, 0.1)' : 'rgba(82, 183, 136, 0.1)',
                color: activity.status === 'alert' ? 'var(--color-warning)' : 'var(--color-success)',
              }}>
                {activity.status === 'alert' ? 'Alert' : 'Completed'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
