import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Layout, GripVertical, Eye, Save } from 'lucide-react';
import api from '../api/client';

const DEFAULT_SECTIONS = [
  { id: 'hero', label: 'Hero Section', visible: true },
  { id: 'about', label: 'About Me', visible: true },
  { id: 'skills', label: 'Skills', visible: true },
  { id: 'education', label: 'Education', visible: true },
  { id: 'experience', label: 'Experience', visible: true },
  { id: 'projects', label: 'Projects', visible: true },
  { id: 'contact', label: 'Contact', visible: true },
];

export default function LayoutControls() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const { data } = await api.get('/api/settings');
      const flat = {};
      (data.settings ?? []).forEach((s) => { flat[s.key] = s.value; });
      setSettings(flat);
      
      const order = flat.layout_sections_order || DEFAULT_SECTIONS.map(s => s.id).join(',');
      const sectionOrder = order.split(',');
      setSections(DEFAULT_SECTIONS.map(s => ({
        ...s,
        visible: flat[`${s.id}_visible`] !== '0',
      })).sort((a, b) => sectionOrder.indexOf(a.id) - sectionOrder.indexOf(b.id)));
    } catch {
      toast.error('Failed to load layout settings');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const order = sections.map(s => s.id).join(',');
      const updates = { layout_sections_order: order };
      sections.forEach(s => {
        updates[`${s.id}_visible`] = s.visible ? '1' : '0';
      });
      await api.post('/api/settings', { ...settings, ...updates });
      toast.success('Layout saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function toggleVisibility(id) {
    setSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }

  function handleDragStart(index) {
    setDraggedIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSections = [...sections];
    const dragged = newSections.splice(draggedIndex, 1)[0];
    newSections.splice(index, 0, dragged);
    setSections(newSections);
    setDraggedIndex(index);
  }

  function resetLayout() {
    setSections(DEFAULT_SECTIONS);
    toast.info('Layout reset to defaults');
  }

  if (loading) return <div className="page-container"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Layout size={24} /> Layout Controls</h1>
          <p className="page-subtitle">Reorder sections and control visibility</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={resetLayout}>Reset</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner-sm" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className="layout-grid">
        <div className="glass-card">
          <div className="card-header"><h2>Section Order</h2></div>
          <div className="section-list">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`section-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
              >
                <GripVertical size={18} className="drag-handle" />
                <span className="section-number">{index + 1}</span>
                <span className="section-label">{section.label}</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={() => toggleVisibility(section.id)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
          <p className="hint">Drag sections to reorder. Toggle visibility to show/hide.</p>
        </div>

        <div className="glass-card">
          <div className="card-header"><h2><Eye size={18} /> Layout Preview</h2></div>
          <div className="layout-preview">
            {sections.filter(s => s.visible).map((section, index) => (
              <div key={section.id} className="preview-section">
                <div className="preview-section-header">
                  <span className="preview-section-number">{index + 1}</span>
                  <span>{section.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
