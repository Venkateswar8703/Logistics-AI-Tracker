import './StatusBadge.css';

const statusConfig = {
  'In Transit': { color: 'blue', pulse: true },
  'Delivered': { color: 'green', pulse: false },
  'Delayed': { color: 'red', pulse: true },
  'Customs Hold': { color: 'amber', pulse: true },
  'Out for Delivery': { color: 'cyan', pulse: true },
  'Processing': { color: 'purple', pulse: true },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || { color: 'blue', pulse: false };

  return (
    <span className={`status-badge ${config.color}`}>
      <span className={`status-dot ${config.pulse ? 'pulse' : ''}`} />
      {status}
    </span>
  );
}

export default StatusBadge;
