import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, Trash2, Copy, Image, FileText, Film, X } from 'lucide-react';
import api from '../api/client';

function fileIcon(mimetype) {
  if (!mimetype) return FileText;
  if (mimetype.startsWith('image/')) return Image;
  if (mimetype.startsWith('video/')) return Film;
  return FileText;
}

export default function Media() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/media');
      setFiles(data.files ?? []);
    } catch { toast.error('Failed to load media'); }
    finally { setLoading(false); }
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function del(id) {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      toast.success('Deleted');
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (preview?.id === id) setPreview(null);
    } catch { toast.error('Delete failed'); }
  }

  function copyUrl(url) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => toast.success('URL copied'));
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p className="page-subtitle">{files.length} file{files.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <span className="spinner-sm" /> : <Upload size={16} />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={upload}
          accept="image/*,video/*,.pdf,.doc,.docx" />
      </div>

      {/* Drop zone */}
      <div
        className="drop-zone glass-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dt = e.dataTransfer;
          if (dt.files[0]) {
            const fakeEvent = { target: { files: dt.files } };
            upload(fakeEvent);
          }
        }}
      >
        <Upload size={32} />
        <p>Drag & drop files here or <button className="link-btn" onClick={() => inputRef.current?.click()}>browse</button></p>
        <p className="hint">Supports images, videos, PDFs — max 10 MB</p>
      </div>

      {loading ? <div className="media-grid-skeleton" /> : files.length === 0 ? null : (
        <div className="media-grid">
          {files.map((file) => {
            const Icon = fileIcon(file.mimetype);
            const isImg = file.mimetype?.startsWith('image/');
            return (
              <div key={file.id} className="media-card glass-card" onClick={() => setPreview(file)}>
                <div className="media-thumb">
                  {isImg
                    ? <img src={file.url} alt={file.original_name} loading="lazy" />
                    : <Icon size={40} />}
                </div>
                <div className="media-info">
                  <p className="media-name" title={file.original_name}>{file.original_name}</p>
                  <p className="media-size">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="media-actions">
                  <button className="btn btn-ghost icon-btn" onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }} title="Copy URL"><Copy size={14} /></button>
                  <button className="btn btn-ghost icon-btn danger" onClick={(e) => { e.stopPropagation(); del(file.id); }} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPreview(null)}>
          <div className="modal modal-lg glass-card">
            <div className="modal-header">
              <h2>{preview.original_name}</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setPreview(null)}><X size={18} /></button>
            </div>
            <div className="modal-body center">
              {preview.mimetype?.startsWith('image/') ? (
                <img src={preview.url} alt={preview.original_name} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }} />
              ) : (
                <div className="file-preview-icon"><FileText size={80} /></div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => copyUrl(preview.url)}><Copy size={16} /> Copy URL</button>
              <button className="btn btn-danger" onClick={() => del(preview.id)}><Trash2 size={16} /> Delete</button>
              <button className="btn btn-ghost" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
