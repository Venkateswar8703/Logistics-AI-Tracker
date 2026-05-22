import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  MessageSquare,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shipments', label: 'Shipments', icon: Package },
  { path: '/freight', label: 'Freight Rates', icon: DollarSign },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare },
];

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Package size={18} />
          </div>
          <span className="sidebar-brand-text">LogisticsAI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="sidebar-nav-icon" size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-item">
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
