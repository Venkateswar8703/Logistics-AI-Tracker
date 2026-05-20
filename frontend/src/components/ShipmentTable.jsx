import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import './ShipmentTable.css';

function ShipmentTable({ shipments = [], limit }) {
  const navigate = useNavigate();
  const displayData = limit ? shipments.slice(0, limit) : shipments;

  if (displayData.length === 0) {
    return (
      <div className="shipment-table-container glass-card-static">
        <div className="shipment-table-empty">
          <p>No shipments found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipment-table-container glass-card-static">
      <div className="shipment-table-scroll">
        <table className="shipment-table">
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Carrier</th>
              <th>ETA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((shipment, index) => (
              <tr
                key={shipment.id || index}
                className="shipment-table-row"
                onClick={() => navigate(`/shipments/${shipment.id}`)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="shipment-tracking">
                  <span className="tracking-number">{shipment.tracking_number}</span>
                </td>
                <td>
                  <span className="location-text">{shipment.origin}</span>
                </td>
                <td>
                  <span className="location-text">{shipment.destination}</span>
                </td>
                <td>
                  <StatusBadge status={shipment.current_status} />
                </td>
                <td>
                  <span className="carrier-text">{shipment.carrier}</span>
                </td>
                <td>
                  <span className="eta-text">
                    {shipment.estimated_delivery
                      ? new Date(shipment.estimated_delivery).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </td>
                <td>
                  <ArrowRight size={16} className="row-arrow" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ShipmentTable;
