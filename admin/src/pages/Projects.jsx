import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Save, ExternalLink, Github } from 'lucide-react';
import api from '../api/client';

const EMPTY = {
  title: '', description: '', tech_stack: '', live_url: '',
  github_url: '', image_url: '', status: 'active', featured: 0,
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | item
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/projects-crud');
      setProjects(data.projects ?? []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY); setModal('create'); }
  function openEdit(p) { setForm({ ...p }); setModal(p); }

  async function save() {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/api/projects-crud', form);
        toast.success('Project created');
      } else {
        await api.put(`/api/projects-crud/${form.id}`, form);
        toast.success('Project updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects-crud/${id}`);
      toast.success('Deleted');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch { toast.error('Delete failed'); }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="table-skeleton" />
      ) : projects.length === 0 ? (
        <div className="empty-state glass-card">
          <Plus size={40} />
          <h3>No projects yet</h3>
          <p>Add your first project to showcase your work</p>
          <button className="btn btn-primary" onClick={openCreate}>Add Project</button>
        </div>
      ) : (
        <div className="data-table-wrap glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Tech Stack</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Links</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-primary">{p.title}</div>
                    <div className="cell-sub">{p.description?.slice(0, 60)}{p.description?.length > 60 ? '…' : ''}</div>
                  </td>
                  <td>
                    <div className="tag-list">
                      {(p.tech_stack ?? '').split(',').filter(Boolean).map((t) => (
                        <span key={t} className="badge badge-ghost">{t.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.featured ? <span className="badge badge-blue">Yes</span> : '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      {p.live_url && <a href={p.live_url} target="_blank" rel="noopener" className="btn btn-ghost icon-btn" title="Live"><ExternalLink size={14} /></a>}
                      {p.github_url && <a href={p.github_url} target="_blank" rel="noopener" className="btn btn-ghost icon-btn" title="GitHub"><Github size={14} /></a>}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost icon-btn" onClick={() => openEdit(p)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-ghost icon-btn danger" onClick={() => del(p.id)} title="Delete"><Trash2 size={14} /></button>
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
              <h2>{modal === 'create' ? 'Add Project' : 'Edit Project'}</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <ProjectForm form={form} setForm={setForm} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner-sm" /> : <Save size={16} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectForm({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={set('title')} />
      </div>
      <div className="form-group span-2">
        <label className="form-label">Description</label>
        <textarea className="form-input form-textarea" value={form.description ?? ''} onChange={set('description')} rows={3} />
      </div>
      <div className="form-group">
        <label className="form-label">Tech Stack (comma separated)</label>
        <input className="form-input" value={form.tech_stack ?? ''} onChange={set('tech_stack')} placeholder="React, Node.js, SQLite" />
      </div>
      <div className="form-group">
        <label className="form-label">Live URL</label>
        <input className="form-input" value={form.live_url ?? ''} onChange={set('live_url')} placeholder="https://" />
      </div>
      <div className="form-group">
        <label className="form-label">GitHub URL</label>
        <input className="form-input" value={form.github_url ?? ''} onChange={set('github_url')} placeholder="https://github.com/…" />
      </div>
      <div className="form-group">
        <label className="form-label">Image URL</label>
        <input className="form-input" value={form.image_url ?? ''} onChange={set('image_url')} placeholder="https://…" />
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-input form-select" value={form.status} onChange={set('status')}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="wip">Work in Progress</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Featured</label>
        <select className="form-input form-select" value={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: Number(e.target.value) }))}>
          <option value={0}>No</option>
          <option value={1}>Yes</option>
        </select>
      </div>
    </div>
  );
}
