import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Toast from '../../components/Toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/pos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-primary/5 via-background to-secondary/30 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-300">
      
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-8 bg-card border border-border rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative backdrop-blur-md">
        <div>
          {/* Brand Logo Icon */}
          <div className="w-16 h-16 rounded-[1.25rem] bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl font-bold">storefront</span>
          </div>

          <h2 className="text-center text-3xl font-black text-foreground tracking-tight">
            Emerald POS
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Sign in to access your cashier terminal and inventory dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-muted-foreground text-lg">mail</span>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-secondary/50 border border-border text-body-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition-all duration-200"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-muted-foreground text-lg">lock</span>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-secondary/50 border border-border text-body-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition-all duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-primary text-primary-foreground hover:bg-opacity-95 rounded-full font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200 text-body-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Demo Credentials Panel */}
        <div className="mt-8 pt-6 border-t border-border/60 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">Quick Demo Login</span>
          <div className="flex gap-2.5 justify-center">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@store.com');
                setPassword('admin123');
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border transition-all duration-200"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('cashier1@store.com');
                setPassword('cashier123');
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border transition-all duration-200"
            >
              Cashier
            </button>
          </div>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      </div>
    </div>
  );
};

export default LoginPage;
