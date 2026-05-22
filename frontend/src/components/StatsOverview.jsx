import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import './StatsOverview.css';

const statConfig = [
  { key: 'total', label: 'Total Shipments', icon: Package, color: 'blue' },
  { key: 'in_transit', label: 'In Transit', icon: Truck, color: 'cyan' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'green' },
  { key: 'delayed', label: 'Delayed', icon: AlertTriangle, color: 'red' },
];

function StatsOverview({ stats }) {
  return (
    <div className="stats-grid">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        const value = stats?.[stat.key] ?? 0;

        return (
          <div key={stat.key} className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
