import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      const user = JSON.parse(userString);
      redirectUser(user.roles);
    }
  }, []);

  const redirectUser = (roles: string[]) => {
    if (roles.includes('ADMIN')) navigate('/admin/workflows');
    else if (roles.includes('REQUESTER')) navigate('/requests');
    else if (roles.includes('APPROVER')) navigate('/tasks');
    else navigate('/login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng điền đầy đủ các thông tin đăng nhập');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ username, password });
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          username: res.data.username,
          fullName: res.data.fullName,
          email: res.data.email,
          roles: res.data.roles
        }));
        redirectUser(res.data.roles);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickLogin = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-600/20">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">FlowPilot Portal</h2>
          <p className="text-slate-400 text-sm mt-1 text-center">Hệ thống Tự động hóa Lịch họp Công ty</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">Đăng nhập nhanh các Role Demo</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => triggerQuickLogin('admin', 'admin123')}
              className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium py-2.5 px-3 rounded-xl text-left border border-slate-700/50 flex justify-between items-center transition"
            >
              <span>Quản trị viên</span>
              <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">ADMIN</span>
            </button>
            <button
              onClick={() => triggerQuickLogin('requester01', 'requester123')}
              className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium py-2.5 px-3 rounded-xl text-left border border-slate-700/50 flex justify-between items-center transition"
            >
              <span>Người yêu cầu</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">REQUESTER</span>
            </button>
            <button
              onClick={() => triggerQuickLogin('approver01', 'approver123')}
              className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium py-2.5 px-3 rounded-xl text-left border border-slate-700/50 flex justify-between items-center transition"
            >
              <span>Người duyệt</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded text-[10px]">APPROVER</span>
            </button>
            <button
              onClick={() => triggerQuickLogin('user01', 'user123')}
              className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium py-2.5 px-3 rounded-xl text-left border border-slate-700/50 flex justify-between items-center transition"
            >
              <span>User nội bộ</span>
              <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded text-[10px]">INTERNAL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
