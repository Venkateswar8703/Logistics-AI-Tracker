import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ShipmentTable from '../components/ShipmentTable';
import { getShipments } from '../services/api';
import './Shipments.css';

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'In Transit', value: 'In Transit' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Delayed', value: 'Delayed' },
  { label: 'Customs Hold', value: 'Customs Hold' },
  { label: 'Out for Delivery', value: 'Out for Delivery' },
];

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const data = await getShipments();
        const list = Array.isArray(data) ? data : data?.shipments || [];
        setShipments(list);
        setFilteredShipments(list);
      } catch (err) {
        console.error('Failed to fetch shipments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  useEffect(() => {
    let result = [...shipments];

    // Status filter
    if (activeFilter !== 'all') {
      result = result.filter((s) => s.current_status === activeFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.tracking_number?.toLowerCase().includes(q) ||
          s.origin?.toLowerCase().includes(q) ||
          s.destination?.toLowerCase().includes(q) ||
          s.carrier?.toLowerCase().includes(q)
      );
    }

    setFilteredShipments(result);
  }, [activeFilter, searchQuery, shipments]);

  return (
    <div className="shipments-page">
      <div className="shipments-header">
        <h1 className="page-title">Shipments</h1>
        <span className="shipments-count">{filteredShipments.length} shipments</span>
      </div>

      <SearchBar onSearch={setSearchQuery} />

      {/* Status Filter Tabs */}
      <div className="shipments-filter-tabs">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            className={`filter-tab ${activeFilter === filter.value ? 'filter-tab--active' : ''}`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
            {filter.value !== 'all' && (
              <span className="filter-tab-count">
                {shipments.filter((s) =>
                  filter.value === 'all' ? true : s.current_status === filter.value
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card-static" style={{ padding: 40, textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '100%', height: 300 }} />
        </div>
      ) : (
        <ShipmentTable shipments={filteredShipments} />
      )}
    </div>
  );
}

export default Shipments;
