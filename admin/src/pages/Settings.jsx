import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Save, RefreshCw, Eye, Palette, User, Globe, Mail } from 'lucide-react';
import api from '../api/client';

const TABS = [
  { id: 'profile',    label: 'Profile',    icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'site',       label: 'Site Info',  icon: Globe },
  { id: 'contact',    label: 'Contact',    icon: Mail },
];

const COLOR_FIELDS = ['accent_color', 'accent_secondary', 'bg_color', 'text_color'];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [previewIframe, setPreviewIframe] = useState(null);

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

  const sendPreview = useCallback(
    (updates) => {
      const iframe = previewIframe ?? document.getElementById('preview-iframe');
      if (!iframe) return;
      const merged = { ...settings, ...updates };
      const theme = {};
      COLOR_FIELDS.forEach((f) => { if (merged[f]) theme[f] = merged[f]; });
      try {
        iframe.contentWindow.postMessage(
          { type: 'LIVE_THEME_UPDATE', theme },
          '*'
        );
      } catch { /* cross-origin skip */ }
    },
    [settings, previewIframe]
  );

  function handleChange(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (COLOR_FIELDS.includes(key)) sendPreview({ [key]: value });
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/api/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your portfolio configuration and appearance</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={loadSettings} title="Reload">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner-sm" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        {/* Tab nav */}
        <nav className="settings-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="settings-content glass-card">
          {activeTab === 'profile' && (
            <SettingsSection title="Profile Information">
              <Field label="Your Name" value={settings.name} onChange={(v) => handleChange('name', v)} />
              <Field label="Title / Role" value={settings.title} onChange={(v) => handleChange('title', v)} />
              <Field label="Tagline" value={settings.tagline} onChange={(v) => handleChange('tagline', v)} />
              <Field label="Short Bio" value={settings.bio} onChange={(v) => handleChange('bio', v)} textarea />
              <Field label="Profile Image URL" value={settings.profile_image} onChange={(v) => handleChange('profile_image', v)} />
              <Field label="Hero Background" value={settings.hero_bg} onChange={(v) => handleChange('hero_bg', v)} />
            </SettingsSection>
          )}

          {activeTab === 'appearance' && (
            <SettingsSection title="Theme & Colors">
              <ColorField label="Accent Color (Primary)" value={settings.accent_color ?? '#6366f1'}
                onChange={(v) => handleChange('accent_color', v)} />
              <ColorField label="Accent Color (Secondary)" value={settings.accent_secondary ?? '#8b5cf6'}
                onChange={(v) => handleChange('accent_secondary', v)} />
              <ColorField label="Background Color" value={settings.bg_color ?? '#0a0f1e'}
                onChange={(v) => handleChange('bg_color', v)} />
              <ColorField label="Text Color" value={settings.text_color ?? '#e2e8f0'}
                onChange={(v) => handleChange('text_color', v)} />
              <SelectField label="Font Family" value={settings.font_family ?? 'Inter'}
                options={['Inter', 'Poppins', 'Roboto', 'Fira Code', 'Space Grotesk']}
                onChange={(v) => handleChange('font_family', v)} />
              <SelectField label="Animation Style" value={settings.animation_style ?? 'smooth'}
                options={['smooth', 'snappy', 'minimal', 'none']}
                onChange={(v) => handleChange('animation_style', v)} />
            </SettingsSection>
          )}

          {activeTab === 'site' && (
            <SettingsSection title="Site Information">
              <Field label="Site Title" value={settings.site_title} onChange={(v) => handleChange('site_title', v)} />
              <Field label="Meta Description" value={settings.meta_description} onChange={(v) => handleChange('meta_description', v)} textarea />
              <Field label="Site URL" value={settings.site_url} onChange={(v) => handleChange('site_url', v)} />
              <Field label="GitHub URL" value={settings.github_url} onChange={(v) => handleChange('github_url', v)} />
              <Field label="LinkedIn URL" value={settings.linkedin_url} onChange={(v) => handleChange('linkedin_url', v)} />
              <Field label="Twitter / X URL" value={settings.twitter_url} onChange={(v) => handleChange('twitter_url', v)} />
              <Field label="Resume PDF URL" value={settings.resume_url} onChange={(v) => handleChange('resume_url', v)} />
            </SettingsSection>
          )}

          {activeTab === 'contact' && (
            <SettingsSection title="Contact Settings">
              <Field label="Contact Email" value={settings.contact_email} onChange={(v) => handleChange('contact_email', v)} />
              <Field label="Phone Number" value={settings.phone} onChange={(v) => handleChange('phone', v)} />
              <Field label="Location" value={settings.location} onChange={(v) => handleChange('location', v)} />
              <ToggleField label="Enable Contact Form" value={settings.contact_form_enabled !== '0'}
                onChange={(v) => handleChange('contact_form_enabled', v ? '1' : '0')} />
              <ToggleField label="Enable Booking System" value={settings.booking_enabled !== '0'}
                onChange={(v) => handleChange('booking_enabled', v ? '1' : '0')} />
              <Field label="Booking Instructions" value={settings.booking_instructions}
                onChange={(v) => handleChange('booking_instructions', v)} textarea />
            </SettingsSection>
          )}
        </div>

        {/* Live preview panel */}
        <div className="settings-preview glass-card">
          <div className="card-header">
            <h3><Eye size={16} /> Live Preview</h3>
          </div>
          <div className="preview-wrapper">
            <iframe
              id="preview-iframe"
              src="/"
              title="Portfolio Preview"
              className="preview-iframe"
              ref={(el) => setPreviewIframe(el)}
            />
          </div>
          <p className="preview-hint">Theme changes reflect instantly</p>
        </div>
      </div>
    </div>
  );
}

/* ── Field components ── */

function SettingsSection({ title, children }) {
  return (
    <div className="settings-section">
      <h3 className="section-title">{title}</h3>
      <div className="settings-fields">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {textarea ? (
        <textarea
          className="form-input form-textarea"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type="text"
          className="form-input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="color-input-wrap">
        <input type="color" value={value ?? '#6366f1'} onChange={(e) => onChange(e.target.value)} />
        <input
          type="text"
          className="form-input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select
        className="form-input form-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <div className="form-group form-group-toggle">
      <label className="form-label">{label}</label>
      <button
        type="button"
        className={`toggle ${value ? 'active' : ''}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
      />
    </div>
  );
}
