import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';

const POSITIONS = [
  'Outside Hitter',
  'Opposite Hitter',
  'Setter',
  'Middle Blocker',
  'Libero',
  'Defensive Specialist',
  'Other',
];

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign-in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    if (!regPosition) {
      setRegError('Please select your position.');
      return;
    }

    setRegLoading(true);
    const result = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      position: regPosition,
    });
    if (!result.success) {
      setRegError(result.message);
    } else {
      if (!result.emailSent) {
        setRegError(
          'Your account was submitted, but the admin notification email could not be sent. ' +
          'Please contact the administrator directly.'
        );
      }
      setRegSuccess(true);
    }
    setRegLoading(false);
  };

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
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => { setTab('signin'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'signin'
                  ? 'text-white bg-slate-800 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setRegError(''); setRegSuccess(false); }}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'register'
                  ? 'text-white bg-slate-800 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} />
              Create Account
            </button>
          </div>

          <div className="p-8">
            {/* ── Sign In ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
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

                <p className="text-center text-slate-500 text-xs pt-1">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {tab === 'register' && (
              <>
                {regSuccess ? (
                  <div className="text-center py-6 space-y-4">
                    <CheckCircle size={48} className="text-green-400 mx-auto" />
                    <h3 className="text-white text-lg font-semibold">Request Submitted!</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Your account request has been sent for approval. You will be able to sign in once
                      the administrator approves your request.
                    </p>
                    <button
                      onClick={() => { setTab('signin'); setRegSuccess(false); }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Position
                      </label>
                      <select
                        value={regPosition}
                        onChange={e => setRegPosition(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                      >
                        <option value="" disabled>Select your position…</option>
                        {POSITIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirm}
                        onChange={e => setRegConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {regError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                        {regError}
                      </div>
                    )}

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400/80 text-xs">
                      Your account will require administrator approval before you can sign in.
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {regLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <UserPlus size={16} />
                      )}
                      {regLoading ? 'Submitting…' : 'Request Access'}
                    </button>

                    <p className="text-center text-slate-500 text-xs pt-1">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('signin')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          PBT Sports Team Management · Compatible with iOS &amp; Android
        </p>
      </div>
    </div>
  );
}
