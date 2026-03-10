import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Volleyball } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError('Invalid email or password. Please try again.');
      }
      setLoading(false);
    }, 400);
  };

  const fillDemo = (email: string) => {
    setEmail(email);
    setPassword('password123');
    setError('');
  };

  const DEMO_USERS = [
    { name: 'Alex Rivera', email: 'alex@pbt.com', avatar: 'AR' },
    { name: 'Jordan Blake', email: 'jordan@pbt.com', avatar: 'JB' },
    { name: 'Morgan Chen', email: 'morgan@pbt.com', avatar: 'MC' },
    { name: 'Taylor Davis', email: 'taylor@pbt.com', avatar: 'TD' },
    { name: 'Sam Nguyen', email: 'sam@pbt.com', avatar: 'SN' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-xl">PBT</span>
          </div>
          <h1 className="text-white text-2xl font-bold">PBT Sports</h1>
          <p className="text-slate-400 text-sm mt-1">Team Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
            <LogIn size={20} className="text-blue-400" />
            Member Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@pbt.com"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-3 flex items-center gap-2">
              <Volleyball size={14} />
              Quick Login — Demo Accounts
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => fillDemo(u.email)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.avatar}
                  </div>
                  <div>
                    <p className="text-slate-200 text-xs font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          PBT Sports Team Management · Compatible with iOS &amp; Android
        </p>
      </div>
    </div>
  );
}
