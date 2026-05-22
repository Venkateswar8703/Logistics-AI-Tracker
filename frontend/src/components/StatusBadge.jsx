import './StatusBadge.css';

const statusClass = {
  'In Transit': 'in-transit',
  'Delivered': 'delivered',
  'Delayed': 'delayed',
  'Customs Hold': 'customs-hold',
  'Out for Delivery': 'out-for-delivery',
  'Processing': 'processing',
};

function StatusBadge({ status }) {
  const cls = statusClass[status] || 'in-transit';

  return (
    <span className={`status-badge ${cls}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
