import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../api/client';

const EMPTY = { company: '', role: '', start_date: '', end_date: '', location: '', description: '', skills: '', type: 'full-time' };

export default function Experience() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/experience-crud');
      setItems(data.experience ?? []);
    } catch { toast.error('Failed to load experience'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY); setModal('create'); }
  function openEdit(item) { setForm({ ...item }); setModal(item); }

  async function save() {
    if (!form.company) return toast.error('Company is required');
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/api/experience-crud', form);
        toast.success('Experience created');
      } else {
        await api.put(`/api/experience-crud/${form.id}`, form);
        toast.success('Updated');
      }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete this entry?')) return;
    try { await api.delete(`/api/experience-crud/${id}`); toast.success('Deleted'); setItems((p) => p.filter((i) => i.id !== id)); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Experience</h1>
          <p className="page-subtitle">{items.length} entr{items.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Entry</button>
      </div>

      {loading ? <div className="table-skeleton" /> : items.length === 0 ? (
        <div className="empty-state glass-card"><Plus size={40} /><h3>No experience entries</h3><button className="btn btn-primary" onClick={openCreate}>Add Entry</button></div>
      ) : (
        <div className="data-table-wrap glass-card">
          <table className="data-table">
            <thead><tr><th>Company</th><th>Role</th><th>Type</th><th>Period</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><div className="cell-primary">{item.company}</div><div className="cell-sub">{item.location}</div></td>
                  <td>{item.role}</td>
                  <td><span className="badge badge-blue">{item.type}</span></td>
                  <td>{item.start_date}{item.end_date ? ` – ${item.end_date}` : ' – Present'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost icon-btn" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost icon-btn danger" onClick={() => del(item.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h2>{modal === 'create' ? 'Add Experience' : 'Edit Experience'}</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Company *</label><input className="form-input" value={form.company} onChange={set('company')} /></div>
                <div className="form-group"><label className="form-label">Role / Position</label><input className="form-input" value={form.role ?? ''} onChange={set('role')} /></div>
                <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location ?? ''} onChange={set('location')} /></div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.type} onChange={set('type')}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" value={form.start_date ?? ''} onChange={set('start_date')} placeholder="Jan 2023" /></div>
                <div className="form-group"><label className="form-label">End Date (blank = Present)</label><input className="form-input" value={form.end_date ?? ''} onChange={set('end_date')} placeholder="Dec 2023" /></div>
                <div className="form-group span-2"><label className="form-label">Skills (comma separated)</label><input className="form-input" value={form.skills ?? ''} onChange={set('skills')} /></div>
                <div className="form-group span-2"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={form.description ?? ''} onChange={set('description')} rows={4} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner-sm" /> : <Save size={16} />}{saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
