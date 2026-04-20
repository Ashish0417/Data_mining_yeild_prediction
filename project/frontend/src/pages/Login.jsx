import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', form.username);
      formData.append('password', form.password);
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      
      try {
          const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
          localStorage.setItem('role', payload.role);
          localStorage.setItem('username', payload.sub);
      } catch(e) {}
      
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-morphism rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">AgriAnalytics Pro</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-emerald-700 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
