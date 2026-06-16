import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('admin@aditya.dev');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, restore, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err.message ?? 'Login failed. Check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
      </div>

      <div className="login-card glass-card">
        {/* Logo / header */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Admin Panel</h1>
            <p>Developer Control Center</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aditya.dev"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon-left" />
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input icon-left icon-right"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="input-icon-right btn-icon"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-sm" />
                Authenticating…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="login-hint">
          Secured with JWT · Session expires in 2 hours
        </p>
      </div>
    </div>
  );
}
