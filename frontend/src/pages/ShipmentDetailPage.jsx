import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ShipmentDetail from '../components/ShipmentDetail';
import { getShipmentById } from '../services/api';
import './ShipmentDetailPage.css';

function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShipment = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getShipmentById(id);
        setShipment(data);
      } catch (err) {
        console.error('Failed to fetch shipment:', err);
        setError('Shipment not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [id]);

  return (
    <div className="shipment-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back to Shipments</span>
      </button>

      {loading && (
        <div className="shipment-detail-loading">
          <div className="glass-card-static" style={{ padding: 32 }}>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: 300, height: 16, marginBottom: 32 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 80 }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="shipment-detail-error glass-card-static">
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate('/shipments')}>
            <ArrowLeft size={18} />
            <span>Go to Shipments</span>
          </button>
        </div>
      )}

      {!loading && !error && shipment && <ShipmentDetail shipment={shipment} />}
    </div>
  );
}

export default ShipmentDetailPage;
