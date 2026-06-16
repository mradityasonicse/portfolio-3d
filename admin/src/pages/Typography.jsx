import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Type, Save, Eye } from 'lucide-react';
import api from '../api/client';

const FONT_COMBOS = [
  { id: 'modern', name: 'Modern Tech', display: 'Oswald', body: 'Inter', description: 'Bold headers with clean body text' },
  { id: 'elegant', name: 'Elegant', display: 'Playfair Display', body: 'Lato', description: 'Sophisticated serif headers' },
  { id: 'developer', name: 'Developer', display: 'Space Grotesk', body: 'Fira Code', description: 'Tech-focused monospace pairing' },
  { id: 'friendly', name: 'Friendly', display: 'Poppins', body: 'Roboto', description: 'Approachable and rounded' },
  { id: 'minimal', name: 'Minimal', display: 'Inter', body: 'Inter', description: 'Single font family, ultra clean' },
];

export default function Typography() {
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
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/api/settings', settings);
      toast.success('Typography settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function applyFontPreset(preset) {
    setSettings({ ...settings, font_display: preset.display, font_body: preset.body });
    toast.success(`Applied "${preset.name}" font pairing`);
  }

  if (loading) return <div className="page-container"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Type size={24} /> Typography Management</h1>
          <p className="page-subtitle">Control fonts, sizes, spacing, and text hierarchy</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner-sm" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Typography'}
        </button>
      </div>

      <div className="typography-grid">
        <div className="glass-card">
          <div className="card-header"><h2>Font Pairings</h2></div>
          <div className="font-presets">
            {FONT_COMBOS.map((preset) => (
              <button
                key={preset.id}
                className={`font-preset-btn ${settings.font_display === preset.display && settings.font_body === preset.body ? 'active' : ''}`}
                onClick={() => applyFontPreset(preset)}
              >
                <h3 style={{ fontFamily: preset.display }}>{preset.name}</h3>
                <p style={{ fontFamily: preset.body }}>{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header"><h2>Typography Settings</h2></div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label">Display Font</label>
              <select className="form-input form-select" value={settings.font_display || 'Oswald'} onChange={(e) => setSettings({ ...settings, font_display: e.target.value })}>
                <option value="Oswald">Oswald</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Body Font</label>
              <select className="form-input form-select" value={settings.font_body || 'Inter'} onChange={(e) => setSettings({ ...settings, font_body: e.target.value })}>
                <option value="Inter">Inter</option>
                <option value="Lato">Lato</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Base Font Size (px)</label>
              <input type="number" className="form-input" value={settings.font_base_size || '16'} onChange={(e) => setSettings({ ...settings, font_base_size: e.target.value })} min="12" max="20" />
            </div>

            <div className="form-group">
              <label className="form-label">Line Height</label>
              <input type="number" className="form-input" value={settings.line_height || '1.6'} onChange={(e) => setSettings({ ...settings, line_height: e.target.value })} min="1" max="2" step="0.1" />
            </div>

            <div className="form-group">
              <label className="form-label">Letter Spacing (px)</label>
              <input type="number" className="form-input" value={settings.letter_spacing || '0'} onChange={(e) => setSettings({ ...settings, letter_spacing: e.target.value })} min="-2" max="5" step="0.5" />
            </div>

            <div className="form-group">
              <label className="form-label">Heading Weight</label>
              <select className="form-input form-select" value={settings.heading_weight || '700'} onChange={(e) => setSettings({ ...settings, heading_weight: e.target.value })}>
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra-bold (800)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header"><h2><Eye size={18} /> Typography Preview</h2></div>
          <div className="typography-preview-panel" style={{ fontFamily: settings.font_body || 'Inter', fontSize: settings.font_base_size || '16px', lineHeight: settings.line_height || '1.6' }}>
            <h1 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: parseInt(settings.heading_weight || '700') }}>Heading 1 - Your Name</h1>
            <h2 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: parseInt(settings.heading_weight || '700') }}>Heading 2 - Section Title</h2>
            <h3 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: parseInt(settings.heading_weight || '700') }}>Heading 3 - Card Title</h3>
            <p>Body text: This is how your portfolio content will look. The quick brown fox jumps over the lazy dog.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Type, Save, Eye } from 'lucide-react';
import api from '../api/client';

const FONT_COMBOS = [
  {
    id: 'modern',
    name: 'Modern Tech',
    display: 'Oswald',
    body: 'Inter',
    description: 'Bold headers with clean body text',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    display: 'Playfair Display',
    body: 'Lato',
    description: 'Sophisticated serif headers',
  },
  {
    id: 'developer',
    name: 'Developer',
    display: 'Space Grotesk',
    body: 'Fira Code',
    description: 'Tech-focused monospace pairing',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    display: 'Poppins',
    body: 'Roboto',
    description: 'Approachable and rounded',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    display: 'Inter',
    body: 'Inter',
    description: 'Single font family, ultra clean',
  },
];

export default function Typography() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data } = await api.get('/api/settings');
      const flat = {};
      (data.settings ?? []).forEach((s) => { flat[s.key] = s.value; });
      setSettings(flat);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/api/settings', settings);
      toast.success('Typography settings saved!');
      applyToPreview();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function applyFontPreset(preset) {
    setSettings({
      ...settings,
      font_display: preset.display,
      font_body: preset.body,
    });
    toast.success(`Applied "${preset.name}" font pairing`);
  }

  function applyToPreview() {
    const iframe = document.getElementById('preview-iframe');
    if (!iframe) return;
    try {
      iframe.contentWindow.postMessage(
        {
          type: 'TYPOGRAPHY_UPDATE',
          fontDisplay: settings.font_display,
          fontBody: settings.font_body,
          baseSize: settings.font_base_size || '16',
        },
        '*'
      );
    } catch {}
  }

  if (loading) {
    return <div className="page-container"><div className="spinner" /></div>;
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Type size={24} />
            Typography Management
          </h1>
          <p className="page-subtitle">Control fonts, sizes, spacing, and text hierarchy</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner-sm" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Typography'}
        </button>
      </div>

      <div className="typography-grid">
        {/* Font Presets */}
        <div className="glass-card">
          <div className="card-header">
            <h2>Font Pairings</h2>
          </div>
          <div className="font-presets">
            {FONT_COMBOS.map((preset) => (
              <button
                key={preset.id}
                className={`font-preset-btn ${
                  settings.font_display === preset.display && settings.font_body === preset.body
                    ? 'active'
                    : ''
                }`}
                onClick={() => applyFontPreset(preset)}
              >
                <h3 style={{ fontFamily: preset.display }}>
                  {preset.name}
                </h3>
                <p style={{ fontFamily: preset.body }}>{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Typography Controls */}
        <div className="glass-card">
          <div className="card-header">
            <h2>Typography Settings</h2>
          </div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label">Display Font</label>
              <select
                className="form-input form-select"
                value={settings.font_display || 'Oswald'}
                onChange={(e) => setSettings({ ...settings, font_display: e.target.value })}
              >
                <option value="Oswald">Oswald</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Body Font</label>
              <select
                className="form-input form-select"
                value={settings.font_body || 'Inter'}
                onChange={(e) => setSettings({ ...settings, font_body: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Lato">Lato</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Base Font Size (px)</label>
              <input
                type="number"
                className="form-input"
                value={settings.font_base_size || '16'}
                onChange={(e) => setSettings({ ...settings, font_base_size: e.target.value })}
                min="12"
                max="20"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Line Height</label>
              <input
                type="number"
                className="form-input"
                value={settings.line_height || '1.6'}
                onChange={(e) => setSettings({ ...settings, line_height: e.target.value })}
                min="1"
                max="2"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Letter Spacing (px)</label>
              <input
                type="number"
                className="form-input"
                value={settings.letter_spacing || '0'}
                onChange={(e) => setSettings({ ...settings, letter_spacing: e.target.value })}
                min="-2"
                max="5"
                step="0.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Heading Weight</label>
              <select
                className="form-input form-select"
                value={settings.heading_weight || '700'}
                onChange={(e) => setSettings({ ...settings, heading_weight: e.target.value })}
              >
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra-bold (800)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="glass-card">
          <div className="card-header">
            <h2><Eye size={18} /> Typography Preview</h2>
          </div>
          <div
            className="typography-preview-panel"
            style={{
              fontFamily: settings.font_body || 'Inter',
              fontSize: `${settings.font_base_size || 16}px`,
              lineHeight: settings.line_height || '1.6',
              letterSpacing: `${settings.letter_spacing || 0}px`,
            }}
          >
            <h1 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: settings.heading_weight || 700 }}>
              Heading 1 - Your Name
            </h1>
            <h2 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: settings.heading_weight || 700 }}>
              Heading 2 - Section Title
            </h2>
            <h3 style={{ fontFamily: settings.font_display || 'Oswald', fontWeight: settings.heading_weight || 700 }}>
              Heading 3 - Card Title
            </h3>
            <p>
              Body text: This is how your portfolio content will look.
              The quick brown fox jumps over the lazy dog.
            </p>
            <p style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.9em' }}>
              {`Code: const portfolio = { name: 'Aditya', role: 'Developer' };`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
