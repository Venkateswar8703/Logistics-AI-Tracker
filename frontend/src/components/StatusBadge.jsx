import './StatusBadge.css';

const statusConfig = {
  'In Transit': { color: 'blue', dotPulse: true },
  'Delivered': { color: 'green', dotPulse: false },
  'Delayed': { color: 'red', dotPulse: true },
  'Customs Hold': { color: 'amber', dotPulse: true },
  'Out for Delivery': { color: 'cyan', dotPulse: true },
  'Processing': { color: 'purple', dotPulse: true },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || { color: 'blue', dotPulse: false };

  return (
    <span className={`status-badge status-badge--${config.color}`}>
      <span className={`status-badge-dot ${config.dotPulse ? 'status-badge-dot--pulse' : ''}`} />
      {status}
    </span>
  );
}

export default StatusBadge;
