import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import StatsOverview from '../components/StatsOverview';
import ShipmentTable from '../components/ShipmentTable';
import { getShipments, getShipmentStats } from '../services/api';
import './Dashboard.css';

const quickActions = [
  {
    title: 'Track Shipment',
    description: 'Enter a tracking number to find your package',
    icon: Search,
    color: 'blue',
    path: '/shipments',
  },
  {
    title: 'Get Quote',
    description: 'Calculate freight rates for your route',
    icon: Calculator,
    color: 'green',
    path: '/freight',
  },
  {
    title: 'Ask AI',
    description: 'Chat with our AI logistics assistant',
    icon: MessageSquare,
    color: 'purple',
    path: '/chat',
  },
];

function SkeletonStats() {
  return (
    <div className="stats-overview">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat-card" style={{ opacity: 1 }}>
          <div className="stat-card-header">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 100 }} />
          </div>
          <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 16 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="glass-card-static" style={{ padding: 20 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-row" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 120, height: 16 }} />
          <div className="skeleton" style={{ width: 100, height: 16 }} />
          <div className="skeleton" style={{ width: 100, height: 16 }} />
          <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 100 }} />
          <div className="skeleton" style={{ width: 80, height: 16 }} />
          <div className="skeleton" style={{ width: 90, height: 16 }} />
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, shipmentsData] = await Promise.allSettled([
          getShipmentStats(),
          getShipments({ limit: 5 }),
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }
        if (shipmentsData.status === 'fulfilled') {
          const data = shipmentsData.value;
          setShipments(Array.isArray(data) ? data : data?.shipments || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{getGreeting()} 👋</h1>
          <p className="dashboard-subtitle">Here's what's happening with your logistics today.</p>
        </div>
        <div className="dashboard-header-badge">
          <Sparkles size={14} />
          <span>AI-Powered</span>
        </div>
      </div>

      {/* Stats */}
      {loading ? <SkeletonStats /> : <StatsOverview stats={stats} />}

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                className={`quick-action-card quick-action-card--${action.color}`}
                onClick={() => navigate(action.path)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`quick-action-icon quick-action-icon--${action.color}`}>
                  <Icon size={22} />
                </div>
                <div className="quick-action-content">
                  <span className="quick-action-title">{action.title}</span>
                  <span className="quick-action-desc">{action.description}</span>
                </div>
                <ArrowRight size={18} className="quick-action-arrow" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Recent Shipments</h2>
          <button
            className="dashboard-view-all"
            onClick={() => navigate('/shipments')}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <SkeletonTable />
        ) : (
          <ShipmentTable shipments={shipments} limit={5} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
