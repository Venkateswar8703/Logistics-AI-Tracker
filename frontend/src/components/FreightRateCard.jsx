import { Plane, Ship, Truck, Train } from 'lucide-react';
import './FreightRateCard.css';

const modeConfig = {
  air: { icon: Plane, color: 'blue', label: 'Air Freight' },
  sea: { icon: Ship, color: 'cyan', label: 'Sea Freight' },
  road: { icon: Truck, color: 'green', label: 'Road Freight' },
  rail: { icon: Train, color: 'purple', label: 'Rail Freight' },
};

function FreightRateCard({ rate }) {
  const mode = rate.mode?.toLowerCase() || 'road';
  const config = modeConfig[mode] || modeConfig.road;
  const Icon = config.icon;

  return (
    <div className={`freight-card freight-card--${config.color}`}>
      <div className="freight-card-top-border" />

      <div className="freight-card-header">
        <div className={`freight-card-mode freight-card-mode--${config.color}`}>
          <Icon size={20} />
        </div>
        <span className="freight-card-mode-label">{config.label}</span>
      </div>

      <div className="freight-card-route">
        <div className="freight-card-route-point">
          <span className="freight-card-route-label">From</span>
          <span className="freight-card-route-value">{rate.origin}</span>
        </div>
        <div className="freight-card-route-arrow">→</div>
        <div className="freight-card-route-point">
          <span className="freight-card-route-label">To</span>
          <span className="freight-card-route-value">{rate.destination}</span>
        </div>
      </div>

      <div className="freight-card-details">
        <div className="freight-card-detail">
          <span className="freight-card-detail-label">Carrier</span>
          <span className="freight-card-detail-value">{rate.carrier}</span>
        </div>
        <div className="freight-card-detail">
          <span className="freight-card-detail-label">Transit</span>
          <span className="freight-card-detail-value">{rate.transit_days} days</span>
        </div>
      </div>

      <div className="freight-card-price">
        <span className="freight-card-price-label">Rate</span>
        <span className="freight-card-price-value">
          ${typeof rate.rate === 'number' ? rate.rate.toLocaleString('en-US', { minimumFractionDigits: 2 }) : rate.rate}
        </span>
        <span className="freight-card-price-unit">per {rate.unit || 'kg'}</span>
      </div>
    </div>
  );
}

export default FreightRateCard;
