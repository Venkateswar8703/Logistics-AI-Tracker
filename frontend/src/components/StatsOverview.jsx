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
  {
    key: 'total',
    label: 'Total Shipments',
    value: 0,
    change: 12.5,
    icon: Package,
    color: 'blue',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    key: 'in_transit',
    label: 'In Transit',
    value: 0,
    change: 8.3,
    icon: Truck,
    color: 'cyan',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    value: 0,
    change: 15.2,
    icon: CheckCircle2,
    color: 'green',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    key: 'delayed',
    label: 'Delayed',
    value: 0,
    change: -3.1,
    icon: AlertTriangle,
    color: 'red',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
];

function AnimatedNumber({ target, duration = 1200 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const start = 0;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + (target - start) * eased));
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
    change: stats?.[`${stat.key}_change`] ?? stat.change,
  }));

  return (
    <div className="stats-overview">
      {mergedStats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <div
            key={stat.key}
            className={`stat-card stat-card--${stat.color}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="stat-card-header">
              <div
                className="stat-card-icon"
                style={{ background: stat.gradient }}
              >
                <Icon size={20} />
              </div>
              <div className={`stat-card-change ${isPositive ? 'stat-card-change--positive' : 'stat-card-change--negative'}`}>
                <TrendIcon size={12} />
                <span>{Math.abs(stat.change)}%</span>
              </div>
            </div>
            <div className="stat-card-value">
              <AnimatedNumber target={stat.value} />
            </div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
