import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Palette, Sparkles, CheckCircle, RotateCcw } from 'lucide-react';
import api from '../api/client';

const THEME_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'High-contrast neon colors with dark background',
    colors: {
      accent_color: '#f43f5e',
      accent_secondary: '#8b5cf6',
      bg_color: '#050811',
      surface_color: '#0c1122',
      text_color: '#e2e8f0',
    },
    tags: ['Neon', 'Dark', 'High Contrast'],
  },
  {
    id: 'classic-dark',
    name: 'Classic Dark',
    description: 'Professional dark theme with subtle accents',
    colors: {
      accent_color: '#6366f1',
      accent_secondary: '#8b5cf6',
      bg_color: '#0a0f1e',
      surface_color: '#1e293b',
      text_color: '#f1f5f9',
    },
    tags: ['Professional', 'Dark', 'Clean'],
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism Sleek',
    description: 'Frosted glass effects with gradient accents',
    colors: {
      accent_color: '#06b6d4',
      accent_secondary: '#3b82f6',
      bg_color: '#0f172a',
      surface_color: 'rgba(30, 41, 59, 0.7)',
      text_color: '#f8fafc',
    },
    tags: ['Modern', 'Glass', 'Gradient'],
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean and minimal light theme',
    colors: {
      accent_color: '#2563eb',
      accent_secondary: '#7c3aed',
      bg_color: '#ffffff',
      surface_color: '#f8fafc',
      text_color: '#0f172a',
    },
    tags: ['Light', 'Minimal', 'Clean'],
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    description: 'Professional green theme for interviews',
    colors: {
      accent_color: '#10b981',
      accent_secondary: '#059669',
      bg_color: '#022c22',
      surface_color: '#064e3b',
      text_color: '#ecfdf5',
    },
    tags: ['Professional', 'Green', 'Interview'],
  },
  {
    id: 'sunset',
    name: 'Sunset Warmth',
    description: 'Warm orange and pink gradients',
    colors: {
      accent_color: '#f97316',
      accent_secondary: '#ec4899',
      bg_color: '#1c1917',
      surface_color: '#292524',
      text_color: '#fafaf9',
    },
    tags: ['Warm', 'Orange', 'Creative'],
  },
];

export default function ThemeManager() {
  const [settings, setSettings] = useState({});
  const [activePreset, setActivePreset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customColors, setCustomColors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data } = await api.get('/api/settings');
      const flat = {};
      (data.settings ?? []).forEach((s) => { flat[s.key] = s.value; });
      setSettings(flat);
      setCustomColors({
        accent_color: flat.accent_color || '#6366f1',
        accent_secondary: flat.accent_secondary || '#8b5cf6',
        bg_color: flat.bg_color || '#0a0f1e',
        surface_color: flat.surface_color || '#1e293b',
        text_color: flat.text_color || '#f1f5f9',
      });
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(preset) {
    setActivePreset(preset.id);
    setCustomColors(preset.colors);
    sendPreviewUpdate(preset.colors);
    toast.success(`Applied "${preset.name}" theme`);
  }

  function updateColor(key, value) {
    setActivePreset(null);
    const updated = { ...customColors, [key]: value };
    setCustomColors(updated);
    sendPreviewUpdate({ [key]: value });
  }

  function sendPreviewUpdate(colors) {
    const iframe = document.getElementById('preview-iframe');
    if (!iframe) return;
    try {
      iframe.contentWindow.postMessage(
        { type: 'LIVE_THEME_UPDATE', theme: colors },
        '*'
      );
    } catch {}
  }

  async function saveTheme() {
    setSaving(true);
    try {
      const allSettings = { ...settings, ...customColors };
      await api.post('/api/settings', allSettings);
      setSettings(allSettings);
      toast.success('Theme saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setCustomColors({
      accent_color: '#6366f1',
      accent_secondary: '#8b5cf6',
      bg_color: '#0a0f1e',
      surface_color: '#1e293b',
      text_color: '#f1f5f9',
    });
    setActivePreset(null);
    toast.info('Reset to default colors');
  }

  if (loading) {
    return <div className="page-container"><div className="spinner" /></div>;
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Palette size={24} />
            Theme Management
          </h1>
          <p className="page-subtitle">Choose presets or customize your own color system</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={resetToDefaults}>
            <RotateCcw size={16} />
            Reset
          </button>
          <button className="btn btn-primary" onClick={saveTheme} disabled={saving}>
            {saving ? <span className="spinner-sm" /> : <Sparkles size={16} />}
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      <div className="theme-grid">
        {/* Preset Themes */}
        <div className="glass-card">
          <div className="card-header">
            <h2><Sparkles size={18} /> Preset Themes</h2>
          </div>
          <div className="preset-grid">
            {THEME_PRESETS.map((preset) => (
              <ThemeCard
                key={preset.id}
                preset={preset}
                isActive={activePreset === preset.id}
                onApply={() => applyPreset(preset)}
              />
            ))}
          </div>
        </div>

        {/* Custom Color Editor */}
        <div className="glass-card">
          <div className="card-header">
            <h2><Palette size={18} /> Custom Colors</h2>
          </div>
          <div className="color-editor">
            <ColorPicker
              label="Primary Accent"
              value={customColors.accent_color}
              onChange={(v) => updateColor('accent_color', v)}
            />
            <ColorPicker
              label="Secondary Accent"
              value={customColors.accent_secondary}
              onChange={(v) => updateColor('accent_secondary', v)}
            />
            <ColorPicker
              label="Background"
              value={customColors.bg_color}
              onChange={(v) => updateColor('bg_color', v)}
            />
            <ColorPicker
              label="Surface"
              value={customColors.surface_color}
              onChange={(v) => updateColor('surface_color', v)}
            />
            <ColorPicker
              label="Text"
              value={customColors.text_color}
              onChange={(v) => updateColor('text_color', v)}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="glass-card">
          <div className="card-header">
            <h2>Live Preview</h2>
          </div>
          <div className="preview-wrapper">
            <iframe
              id="preview-iframe"
              src="/"
              title="Theme Preview"
              className="preview-iframe"
            />
          </div>
          <p className="preview-hint">Color changes reflect instantly without reload</p>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ preset, isActive, onApply }) {
  return (
    <div className={`preset-card ${isActive ? 'active' : ''}`}>
      <div className="preset-preview">
        <div
          className="color-swatch"
          style={{ background: preset.colors.accent_color }}
        />
        <div
          className="color-swatch"
          style={{ background: preset.colors.accent_secondary }}
        />
        <div
          className="color-swatch"
          style={{ background: preset.colors.bg_color }}
        />
      </div>
      <h3>{preset.name}</h3>
      <p>{preset.description}</p>
      <div className="preset-tags">
        {preset.tags.map((tag) => (
          <span key={tag} className="preset-tag">{tag}</span>
        ))}
      </div>
      <button className="btn btn-sm" onClick={onApply}>
        {isActive ? <><CheckCircle size={14} /> Active</> : 'Apply Theme'}
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="color-input-wrap">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
