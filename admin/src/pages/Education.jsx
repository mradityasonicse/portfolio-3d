import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../api/client';

const EMPTY = { institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '', description: '' };

export default function Education() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/education-crud');
      setItems(data.education ?? []);
    } catch { toast.error('Failed to load education'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY); setModal('create'); }
  function openEdit(item) { setForm({ ...item }); setModal(item); }

  async function save() {
    if (!form.institution) return toast.error('Institution is required');
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/api/education-crud', form);
        toast.success('Education entry created');
      } else {
        await api.put(`/api/education-crud/${form.id}`, form);
        toast.success('Updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/api/education-crud/${id}`);
      toast.success('Deleted');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { toast.error('Delete failed'); }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Education</h1>
          <p className="page-subtitle">{items.length} entr{items.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Entry</button>
      </div>

      {loading ? <div className="table-skeleton" /> : items.length === 0 ? (
        <div className="empty-state glass-card">
          <Plus size={40} /><h3>No education entries</h3>
          <button className="btn btn-primary" onClick={openCreate}>Add Entry</button>
        </div>
      ) : (
        <div className="data-table-wrap glass-card">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Degree / Field</th><th>Period</th><th>Grade</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><div className="cell-primary">{item.institution}</div></td>
                  <td><div className="cell-primary">{item.degree}</div><div className="cell-sub">{item.field}</div></td>
                  <td>{item.start_year}{item.end_year ? ` – ${item.end_year}` : ' – Present'}</td>
                  <td>{item.grade ?? '—'}</td>
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
              <h2>{modal === 'create' ? 'Add Education' : 'Edit Education'}</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Institution *</label><input className="form-input" value={form.institution} onChange={set('institution')} /></div>
                <div className="form-group"><label className="form-label">Degree</label><input className="form-input" value={form.degree ?? ''} onChange={set('degree')} /></div>
                <div className="form-group"><label className="form-label">Field of Study</label><input className="form-input" value={form.field ?? ''} onChange={set('field')} /></div>
                <div className="form-group"><label className="form-label">Grade / CGPA</label><input className="form-input" value={form.grade ?? ''} onChange={set('grade')} /></div>
                <div className="form-group"><label className="form-label">Start Year</label><input className="form-input" value={form.start_year ?? ''} onChange={set('start_year')} /></div>
                <div className="form-group"><label className="form-label">End Year (blank = Present)</label><input className="form-input" value={form.end_year ?? ''} onChange={set('end_year')} /></div>
                <div className="form-group span-2"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={form.description ?? ''} onChange={set('description')} rows={3} /></div>
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
