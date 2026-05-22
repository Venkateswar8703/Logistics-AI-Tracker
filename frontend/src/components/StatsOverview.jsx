import { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import './StatsOverview.css';

const defaultStats = [
  { key: 'total', label: 'Total Shipments', value: 0, change: 12.5, icon: Package, gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
  { key: 'in_transit', label: 'In Transit', value: 0, change: 8.3, icon: Truck, gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
  { key: 'delivered', label: 'Delivered', value: 0, change: 15.2, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #16a34a, #22c55e)' },
  { key: 'delayed', label: 'Delayed', value: 0, change: -3.1, icon: AlertTriangle, gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
];

function AnimatedNumber({ target, duration = 1200 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{current.toLocaleString()}</span>;
}

function StatsOverview({ stats }) {
  const mergedStats = defaultStats.map((stat) => ({
    ...stat,
    value: stats?.[stat.key] ?? stat.value,
  }));

  return (
    <div className="stats-grid">
      {mergedStats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <div
            key={stat.key}
            className="stat-card glass-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="stat-header">
              <div className="stat-icon" style={{ background: stat.gradient }}>
                <Icon size={18} />
              </div>
              <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                <TrendIcon size={12} />
                <span>{Math.abs(stat.change)}%</span>
              </div>
            </div>
            <div className="stat-value">
              <AnimatedNumber target={stat.value} />
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
