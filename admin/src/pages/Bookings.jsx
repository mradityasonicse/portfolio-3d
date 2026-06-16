import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, Clock, Trash2, Eye, X } from 'lucide-react';
import api from '../api/client';

const STATUS_COLORS = {
  pending: 'badge-orange',
  confirmed: 'badge-green',
  cancelled: 'badge-red',
  completed: 'badge-blue',
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/bookings');
      setBookings(data.bookings ?? []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status });
      toast.success(`Booking ${status}`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      if (selected?.id === id) setSelected((s) => ({ ...s, status }));
    } catch { toast.error('Update failed'); }
  }

  async function del(id) {
    if (!confirm('Delete booking?')) return;
    try {
      await api.delete(`/api/bookings/${id}`);
      toast.success('Deleted');
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Delete failed'); }
  }

  const pending = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">
            {bookings.length} total
            {pending > 0 && <span className="badge badge-orange ml-2">{pending} pending</span>}
          </p>
        </div>
      </div>

      {loading ? <div className="table-skeleton" /> : bookings.length === 0 ? (
        <div className="empty-state glass-card"><Calendar size={40} /><h3>No bookings yet</h3></div>
      ) : (
        <div className="data-table-wrap glass-card">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Date / Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><div className="cell-primary">{b.name}</div></td>
                  <td>{b.email}</td>
                  <td>{b.date} {b.time && `@ ${b.time}`}</td>
                  <td>{b.type ?? '—'}</td>
                  <td><span className={`badge ${STATUS_COLORS[b.status] ?? 'badge-gray'}`}>{b.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost icon-btn" onClick={() => setSelected(b)} title="View"><Eye size={14} /></button>
                      {b.status === 'pending' && (
                        <>
                          <button className="btn btn-ghost icon-btn" style={{ color: 'var(--accent-green)' }} onClick={() => updateStatus(b.id, 'confirmed')} title="Confirm"><CheckCircle size={14} /></button>
                          <button className="btn btn-ghost icon-btn danger" onClick={() => updateStatus(b.id, 'cancelled')} title="Cancel"><XCircle size={14} /></button>
                        </>
                      )}
                      <button className="btn btn-ghost icon-btn danger" onClick={() => del(b.id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <dl className="detail-list">
                <dt>Name</dt><dd>{selected.name}</dd>
                <dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd>
                <dt>Date</dt><dd>{selected.date}</dd>
                <dt>Time</dt><dd>{selected.time ?? '—'}</dd>
                <dt>Type</dt><dd>{selected.type ?? '—'}</dd>
                <dt>Status</dt><dd><span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></dd>
                {selected.message && <><dt>Message</dt><dd>{selected.message}</dd></>}
                <dt>Received</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd>
              </dl>
            </div>
            <div className="modal-footer">
              {selected.status === 'pending' && (
                <>
                  <button className="btn btn-primary" onClick={() => updateStatus(selected.id, 'confirmed')}>
                    <CheckCircle size={16} /> Confirm
                  </button>
                  <button className="btn btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>
                    <XCircle size={16} /> Cancel
                  </button>
                </>
              )}
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
