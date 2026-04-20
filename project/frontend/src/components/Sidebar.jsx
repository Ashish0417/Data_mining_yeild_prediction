import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-emerald-900 text-white min-h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] relative z-10 transition-all duration-300">
      <div className="h-24 flex items-center justify-center border-b border-emerald-800 bg-emerald-950">
          <h2 className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 select-none cursor-default">
             AGRI<span className="font-light">ANALYTICS</span>
          </h2>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-3">
        <div className="text-emerald-400/80 text-[10px] uppercase font-bold tracking-[0.2em] mb-2 ps-2">Main</div>
        <button className="w-full text-left px-4 py-3 hover:bg-emerald-800/50 hover:text-emerald-100 rounded-xl transition-all font-medium flex items-center gap-3 text-sm" onClick={() => window.dispatchEvent(new CustomEvent('nav', {detail: 'home'}))}>
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Dashboard Home
        </button>
        <button className="w-full text-left px-4 py-3 hover:bg-emerald-800/50 hover:text-emerald-100 rounded-xl transition-all font-medium flex items-center gap-3 text-sm" onClick={() => window.dispatchEvent(new CustomEvent('nav', {detail: 'predict'}))}>
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
           Yield Prediction
        </button>
        { (role === 'ADMIN' || role === 'SUPERUSER') && (
          <>
            <div className="text-emerald-400/80 text-[10px] uppercase font-bold tracking-[0.2em] mt-8 mb-2 ps-2">Administration</div>
            <button className="w-full text-left px-4 py-3 hover:bg-emerald-800/50 hover:text-emerald-100 rounded-xl transition-all font-medium flex items-center gap-3 text-sm" onClick={() => window.dispatchEvent(new CustomEvent('nav', {detail: 'upload'}))}>
               <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
               Bulk Data Upload
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-emerald-800/50 hover:text-emerald-100 rounded-xl transition-all font-medium flex items-center gap-3 text-sm" onClick={() => window.dispatchEvent(new CustomEvent('nav', {detail: 'reports'}))}>
               <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
               Data Mining Reports
            </button>
          </>
        )}
        { role === 'SUPERUSER' && (
           <button className="w-full text-left px-4 py-3 hover:bg-emerald-800/50 hover:text-emerald-100 rounded-xl transition-all font-medium flex items-center gap-3 text-sm" onClick={() => window.dispatchEvent(new CustomEvent('nav', {detail: 'system'}))}>
               <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               System & Retrain
           </button>
        )}
      </nav>
      <div className="p-4 bg-emerald-950">
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-emerald-800/80 hover:bg-rose-600/90 text-sm font-semibold text-white py-3 rounded-xl transition-all shadow border border-emerald-700 hover:border-rose-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
