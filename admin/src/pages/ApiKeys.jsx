import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, X, Save } from 'lucide-react';
import api from '../api/client';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: 'read' });
  const [showModal, setShowModal] = useState(false);
  const [revealed, setRevealed] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/admin/api-keys');
      setKeys(data.keys ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function create() {
    if (!form.name) return toast.error('Name is required');
    setCreating(true);
    try {
      const { data } = await api.post('/api/admin/api-keys', form);
      toast.success('API key created — copy it now, it will be hidden');
      setKeys((prev) => [data.key, ...prev]);
      setShowModal(false);
      setForm({ name: '', permissions: 'read' });
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Failed');
    } finally { setCreating(false); }
  }

  async function del(id) {
    if (!confirm('Delete this API key?')) return;
    try {
      await api.delete(`/api/admin/api-keys/${id}`);
      toast.success('Key deleted');
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch { toast.error('Delete failed'); }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => toast.success('Copied'));
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">{keys.length} key{keys.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Key</button>
      </div>

      {loading ? <div className="table-skeleton" /> : keys.length === 0 ? (
        <div className="empty-state glass-card"><Key size={40} /><h3>No API keys</h3><button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Key</button></div>
      ) : (
        <div className="data-table-wrap glass-card">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Permissions</th><th>Key</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td><div className="cell-primary">{k.name}</div></td>
                  <td><span className="badge badge-blue">{k.permissions}</span></td>
                  <td>
                    <div className="key-cell">
                      <code>{revealed[k.id] ? k.key : (k.key ? `${k.key.slice(0, 8)}${'•'.repeat(20)}` : '••••••••••••')}</code>
                      <button className="btn btn-ghost icon-btn" onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}>
                        {revealed[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      {k.key && <button className="btn btn-ghost icon-btn" onClick={() => copyKey(k.key)}><Copy size={12} /></button>}
                    </div>
                  </td>
                  <td>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-ghost icon-btn danger" onClick={() => del(k.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h2>Create API Key</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Key Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mobile App" />
              </div>
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <select className="form-input form-select" value={form.permissions} onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.value }))}>
                  <option value="read">Read only</option>
                  <option value="write">Read + Write</option>
                  <option value="admin">Full Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create} disabled={creating}>
                {creating ? <span className="spinner-sm" /> : <Save size={16} />}{creating ? 'Creating…' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
