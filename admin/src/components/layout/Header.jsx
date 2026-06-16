import { Bell, Search, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="btn btn-ghost icon-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {searchOpen ? (
          <div className="header-search-box">
            <Search size={16} />
            <input
              autoFocus
              type="text"
              placeholder="Search pages, settings…"
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        ) : (
          <button
            className="btn btn-ghost header-search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span>Search…</span>
            <kbd>Ctrl K</kbd>
          </button>
        )}
      </div>

      <div className="header-right">
        <button className="btn btn-ghost icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        <div className="header-avatar" title={user?.email ?? 'Admin'}>
          {(user?.name ?? 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
