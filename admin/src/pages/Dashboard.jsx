import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, GraduationCap, Briefcase, MessageSquare,
  Calendar, Image, Activity, ArrowRight, TrendingUp,
  Users, Eye, Clock
} from 'lucide-react';
import api from '../api/client';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className="stat-card glass-card">
      <div className="stat-icon" style={{ '--accent': color }}>
        <Icon size={22} />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value ?? '—'}</h3>
      </div>
      <ArrowRight size={16} className="stat-arrow" />
    </Link>
  );
}

function ActivityItem({ item }) {
  return (
    <div className="activity-item">
      <span className="activity-dot" />
      <div className="activity-body">
        <p className="activity-action">{item.action}</p>
        <span className="activity-time">
          {new Date(item.created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, actRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/activity?limit=10'),
        ]);
        setStats(statsRes.data);
        setActivity(actRes.data.logs ?? []);
      } catch {
        // stats endpoint may not exist yet — silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { icon: FolderOpen,    label: 'Projects',   value: stats?.projects,   color: 'var(--accent-blue)',   to: '/admin/projects' },
    { icon: GraduationCap, label: 'Education',  value: stats?.education,  color: 'var(--accent-purple)', to: '/admin/education' },
    { icon: Briefcase,     label: 'Experience', value: stats?.experience, color: 'var(--accent-cyan)',   to: '/admin/experience' },
    { icon: MessageSquare, label: 'Messages',   value: stats?.messages,   color: 'var(--accent-green)',  to: '/admin/messages' },
    { icon: Calendar,      label: 'Bookings',   value: stats?.bookings,   color: 'var(--accent-orange)', to: '/admin/bookings' },
    { icon: Image,         label: 'Media',      value: stats?.media,      color: 'var(--accent-pink)',   to: '/admin/media' },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, here's your portfolio at a glance</p>
        </div>
        <Link to="/admin/settings" className="btn btn-primary">
          <Activity size={16} /> Quick Settings
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="stats-grid skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card glass-card skeleton" />
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          {cards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="dashboard-grid">
        <div className="glass-card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            {[
              { label: 'Add Project',    to: '/admin/projects',   icon: FolderOpen },
              { label: 'View Messages',  to: '/admin/messages',   icon: MessageSquare },
              { label: 'Manage Bookings',to: '/admin/bookings',   icon: Calendar },
              { label: 'Upload Media',   to: '/admin/media',      icon: Image },
              { label: 'Edit Settings',  to: '/admin/settings',   icon: Activity },
              { label: 'DB Console',     to: '/admin/database',   icon: TrendingUp },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="quick-action-btn">
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state small">
              <Clock size={32} />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="activity-list">
              {activity.map((item, i) => (
                <ActivityItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
