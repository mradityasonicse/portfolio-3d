import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, Key, RefreshCw, Trash2, Plus, Copy, Eye, EyeOff, X, Save, Lock } from 'lucide-react';
import api from '../api/client';

export default function Security() {
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [sessRes, logRes] = await Promise.all([
        api.get('/api/admin/sessions'),
        api.get('/api/admin/activity?limit=20'),
      ]);
      setSessions(sessRes.data.sessions ?? []);
      setLogs(logRes.data.logs ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function revokeSession(id) {
    try {
      await api.delete(`/api/admin/sessions/${id}`);
      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch { toast.error('Failed'); }
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Failed to update password');
    } finally { setSavingPw(false); }
  }

  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security</h1>
          <p className="page-subtitle">Sessions, password, and audit logs</p>
        </div>
      </div>

      <div className="security-grid">
        {/* Change Password */}
        <div className="glass-card">
          <div className="card-header"><h2><Lock size={16} /> Change Password</h2></div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-icon-wrap">
                <input type={showPw ? 'text' : 'password'} className="form-input icon-right" value={pwForm.currentPassword} onChange={setPw('currentPassword')} />
                <button type="button" className="input-icon-right btn-icon" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwForm.newPassword} onChange={setPw('newPassword')} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} />
            </div>
            <button className="btn btn-primary" onClick={changePassword} disabled={savingPw}>
              {savingPw ? <span className="spinner-sm" /> : <Save size={16} />}
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-card">
          <div className="card-header"><h2><Shield size={16} /> Active Sessions</h2></div>
          {loading ? <div className="spinner" /> : sessions.length === 0 ? (
            <div className="empty-state small"><Shield size={32} /><p>No active sessions</p></div>
          ) : (
            <div className="sessions-list">
              {sessions.map((s) => (
                <div key={s.id} className="session-item">
                  <div>
                    <p className="session-ip">{s.ip_address ?? 'Unknown IP'}</p>
                    <p className="session-time">Created: {new Date(s.created_at).toLocaleString()}</p>
                    <p className="session-time">Expires: {new Date(s.expires_at).toLocaleString()}</p>
                  </div>
                  <button className="btn btn-ghost icon-btn danger" onClick={() => revokeSession(s.id)} title="Revoke">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="glass-card span-full">
          <div className="card-header"><h2><RefreshCw size={16} /> Audit Log</h2></div>
          {loading ? <div className="spinner" /> : logs.length === 0 ? (
            <div className="empty-state small"><p>No activity recorded</p></div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Action</th><th>IP</th><th>Time</th></tr></thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i}>
                      <td>{log.action}</td>
                      <td>{log.ip_address ?? '—'}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
