import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Layers, FolderOpen, GraduationCap,
  Briefcase, MessageSquare, CalendarCheck, Image, Database,
  BarChart3, Shield, HardDriveDownload, Rocket, Key, FileText,
  LogOut, Bot, Palette, Type, Layout, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const nav = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    label: 'Design System',
    items: [
      { to: '/admin/theme', label: 'Theme Manager', icon: Palette },
      { to: '/admin/typography', label: 'Typography', icon: Type },
      { to: '/admin/layout', label: 'Layout Controls', icon: Layout },
      { to: '/admin/animations', label: 'Animations', icon: Sparkles },
      { to: '/admin/settings', label: 'Site Settings', icon: Settings },
    ]
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/content', label: 'Section Builder', icon: Layers },
      { to: '/admin/pages', label: 'Page Builder', icon: FileText },
      { to: '/admin/media', label: 'Media Library', icon: Image },
    ]
  },
  {
    label: 'Portfolio Data',
    items: [
      { to: '/admin/projects', label: 'Projects', icon: FolderOpen },
      { to: '/admin/education', label: 'Education', icon: GraduationCap },
      { to: '/admin/experience', label: 'Experience', icon: Briefcase },
    ]
  },
  {
    label: 'Engagement',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/admin/database', label: 'Database', icon: Database },
      { to: '/admin/backup', label: 'Backup', icon: HardDriveDownload },
      { to: '/admin/deploy', label: 'Deploy', icon: Rocket },
      { to: '/admin/security', label: 'Security', icon: Shield },
      { to: '/admin/api-keys', label: 'API Keys', icon: Key },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'AD';

  return (
    <aside className="sidebar animate-slide-left">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">Dev Panel</div>
          <div className="sidebar-logo-sub">v2.0 // portfolio</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user?.email || 'admin@aditya.dev'}</div>
            <div className="sidebar-user-role">{user?.role || 'admin'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            title="Logout"
            style={{ padding: '0.35rem', minWidth: 'unset' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
