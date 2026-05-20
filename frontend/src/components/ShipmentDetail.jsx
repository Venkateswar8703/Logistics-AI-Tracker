import { useEffect, useState } from 'react';
import {
  MapPin,
  Calendar,
  Weight,
  Clock,
  Building2,
  Hash,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import './ShipmentDetail.css';

const timelineIcons = {
  created: Circle,
  picked_up: Truck,
  in_transit: Truck,
  customs: AlertTriangle,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  delayed: AlertTriangle,
};

function ShipmentDetail({ shipment }) {
  const [animateTimeline, setAnimateTimeline] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateTimeline(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!shipment) return null;

  const infoItems = [
    { icon: Hash, label: 'Tracking Number', value: shipment.tracking_number },
    { icon: MapPin, label: 'Origin', value: shipment.origin },
    { icon: MapPin, label: 'Destination', value: shipment.destination },
    { icon: Building2, label: 'Carrier', value: shipment.carrier },
    { icon: Weight, label: 'Weight', value: shipment.weight ? `${shipment.weight} kg` : '—' },
    {
      icon: Calendar,
      label: 'Created',
      value: shipment.created_at
        ? new Date(shipment.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
    },
    {
      icon: Clock,
      label: 'Estimated Delivery',
      value: shipment.estimated_delivery
        ? new Date(shipment.estimated_delivery).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
    },
  ];

  const timeline = shipment.tracking_history || shipment.timeline || [];

  return (
    <div className="shipment-detail">
      {/* Header */}
      <div className="shipment-detail-header glass-card-static">
        <div className="shipment-detail-header-left">
          <h2 className="shipment-detail-tracking">{shipment.tracking_number}</h2>
          <div className="shipment-detail-route">
            <span>{shipment.origin}</span>
            <ArrowRight size={16} className="route-arrow" />
            <span>{shipment.destination}</span>
          </div>
        </div>
        <div className="shipment-detail-header-right">
          <StatusBadge status={shipment.current_status} />
          <span className="shipment-detail-carrier">{shipment.carrier}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="shipment-detail-grid">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="shipment-info-card glass-card"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="shipment-info-icon">
                <Icon size={18} />
              </div>
              <div className="shipment-info-content">
                <span className="shipment-info-label">{item.label}</span>
                <span className="shipment-info-value">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="shipment-timeline-section">
          <h3 className="section-title">Tracking Timeline</h3>
          <div className={`shipment-timeline ${animateTimeline ? 'shipment-timeline--animate' : ''}`}>
            <div className="timeline-line" />
            {timeline.map((event, index) => {
              const IconComponent = timelineIcons[event.type] || Circle;
              const isLast = index === timeline.length - 1;

              return (
                <div
                  key={index}
                  className={`timeline-event ${isLast ? 'timeline-event--current' : ''}`}
                  style={{ animationDelay: `${index * 150 + 400}ms` }}
                >
                  <div className={`timeline-dot ${isLast ? 'timeline-dot--current' : ''}`}>
                    <IconComponent size={14} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-event-header">
                      <span className="timeline-event-title">{event.status || event.title}</span>
                      <span className="timeline-event-time">
                        {event.timestamp
                          ? new Date(event.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    {event.location && (
                      <span className="timeline-event-location">
                        <MapPin size={12} /> {event.location}
                      </span>
                    )}
                    {event.description && (
                      <p className="timeline-event-desc">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentDetail;
