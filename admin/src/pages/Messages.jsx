import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Mail, Eye, X, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/messages');
      setMessages(data.messages ?? []);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }

  async function markRead(id) {
    try {
      await api.patch(`/api/messages/${id}/read`);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: 1 } : m));
    } catch { /* silent */ }
  }

  async function del(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      toast.success('Deleted');
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Delete failed'); }
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            {messages.length} total
            {unread > 0 && <span className="badge badge-green ml-2">{unread} unread</span>}
          </p>
        </div>
      </div>

      {loading ? <div className="table-skeleton" /> : messages.length === 0 ? (
        <div className="empty-state glass-card"><Mail size={40} /><h3>No messages yet</h3><p>Contact form submissions will appear here</p></div>
      ) : (
        <div className="messages-layout">
          <div className="messages-list glass-card">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-item ${selected?.id === msg.id ? 'active' : ''} ${!msg.read ? 'unread' : ''}`}
                onClick={() => { setSelected(msg); if (!msg.read) markRead(msg.id); }}
              >
                <div className="message-header-row">
                  <span className="message-name">{msg.name}</span>
                  <span className="message-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <div className="message-subject">{msg.subject || msg.email}</div>
                <div className="message-preview">{msg.message?.slice(0, 80)}…</div>
              </div>
            ))}
          </div>

          <div className="message-detail glass-card">
            {selected ? (
              <>
                <div className="detail-header">
                  <div>
                    <h2>{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="detail-email">{selected.email}</a>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost icon-btn danger" onClick={() => del(selected.id)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                {selected.subject && <p className="detail-subject"><strong>Subject:</strong> {selected.subject}</p>}
                <p className="detail-date"><Clock size={12} /> {new Date(selected.created_at).toLocaleString()}</p>
                <div className="detail-body">{selected.message}</div>
                <a href={`mailto:${selected.email}`} className="btn btn-primary mt-4">
                  <Mail size={16} /> Reply via Email
                </a>
              </>
            ) : (
              <div className="empty-state small"><Eye size={32} /><p>Select a message to read</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
