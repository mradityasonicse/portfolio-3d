import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, Save } from 'lucide-react';
import api from '../api/client';

export default function AnimationControls() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const { data } = await api.get('/api/settings');
      const flat = {};
      (data.settings ?? []).forEach((s) => { flat[s.key] = s.value; });
      setSettings(flat);
    } catch {
      toast.error('Failed to load animation settings');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/api/settings', settings);
      toast.success('Animation settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-container"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Sparkles size={24} /> Animation Controls</h1>
          <p className="page-subtitle">Manage transitions, effects, and performance</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner-sm" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Animations'}
        </button>
      </div>

      <div className="animation-grid">
        <div className="glass-card">
          <div className="card-header"><h2>Global Animation Settings</h2></div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label">Animation Style</label>
              <select className="form-input form-select" value={settings.animation_style || 'smooth'} onChange={(e) => setSettings({ ...settings, animation_style: e.target.value })}>
                <option value="smooth">Smooth (Default)</option>
                <option value="snappy">Snappy (Fast)</option>
                <option value="minimal">Minimal (Subtle)</option>
                <option value="none">Disabled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transition Duration (ms)</label>
              <input type="range" className="form-range" min="100" max="1000" step="50" value={settings.transition_duration || '300'} onChange={(e) => setSettings({ ...settings, transition_duration: e.target.value })} />
              <span className="range-value">{settings.transition_duration || 300}ms</span>
            </div>

            <div className="form-group">
              <label className="form-label">Easing Function</label>
              <select className="form-input form-select" value={settings.easing || 'ease-in-out'} onChange={(e) => setSettings({ ...settings, easing: e.target.value })}>
                <option value="ease-in-out">Ease In-Out</option>
                <option value="ease-out">Ease Out</option>
                <option value="linear">Linear</option>
                <option value="cubic-bezier">Custom (Bounce)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header"><h2>Feature Toggles</h2></div>
          <div className="settings-fields">
            <ToggleField label="Enable Scroll Animations" value={settings.scroll_animations !== '0'} onChange={(v) => setSettings({ ...settings, scroll_animations: v ? '1' : '0' })} />
            <ToggleField label="Enable Hover Effects" value={settings.hover_effects !== '0'} onChange={(v) => setSettings({ ...settings, hover_effects: v ? '1' : '0' })} />
            <ToggleField label="Enable Particle Effects" value={settings.particle_effects === '1'} onChange={(v) => setSettings({ ...settings, particle_effects: v ? '1' : '0' })} />
            <ToggleField label="Enable 3D Transforms" value={settings.transforms_3d === '1'} onChange={(v) => setSettings({ ...settings, transforms_3d: v ? '1' : '0' })} />
            <ToggleField label="Enable Parallax" value={settings.parallax === '1'} onChange={(v) => setSettings({ ...settings, parallax: v ? '1' : '0' })} />
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header"><h2>Performance Mode</h2></div>
          <div className="performance-info">
            <p>Disabling heavy animations improves battery life and performance on lower-end devices.</p>
            <button className="btn btn-sm" onClick={() => setSettings({ ...settings, scroll_animations: '0', hover_effects: '1', particle_effects: '0', transforms_3d: '0', parallax: '0', animation_style: 'minimal' })}>
              Apply Performance Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <div className="form-group form-group-toggle">
      <label className="form-label">{label}</label>
      <button type="button" className={`toggle ${value ? 'active' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value} />
    </div>
  );
}
