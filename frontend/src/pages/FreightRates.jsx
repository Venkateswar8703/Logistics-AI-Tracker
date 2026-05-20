import { useEffect, useState } from 'react';
import { Search, Plane, Ship, Truck, Train } from 'lucide-react';
import FreightRateCard from '../components/FreightRateCard';
import { getFreightRates } from '../services/api';
import './FreightRates.css';

const modeFilters = [
  { label: 'All Modes', value: 'all', icon: null },
  { label: 'Air', value: 'air', icon: Plane },
  { label: 'Sea', value: 'sea', icon: Ship },
  { label: 'Road', value: 'road', icon: Truck },
  { label: 'Rail', value: 'rail', icon: Train },
];

function FreightRates() {
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [activeMode, setActiveMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const data = await getFreightRates();
        const list = Array.isArray(data) ? data : data?.rates || [];
        setRates(list);
        setFilteredRates(list);
      } catch (err) {
        console.error('Failed to fetch freight rates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    let result = [...rates];

    if (activeMode !== 'all') {
      result = result.filter((r) => r.mode?.toLowerCase() === activeMode);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.origin?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q) ||
          r.carrier?.toLowerCase().includes(q)
      );
    }

    setFilteredRates(result);
  }, [activeMode, searchQuery, rates]);

  return (
    <div className="freight-page">
      <div className="freight-header">
        <div>
          <h1 className="page-title">Freight Rates</h1>
          <p className="freight-subtitle">Compare shipping rates across modes and carriers</p>
        </div>
      </div>

      {/* Search */}
      <div className="freight-search glass-card-static">
        <Search size={18} className="freight-search-icon" />
        <input
          type="text"
          className="freight-search-input"
          placeholder="Search by origin, destination, or carrier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mode Filter Tabs */}
      <div className="freight-mode-tabs">
        {modeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.value}
              className={`mode-tab ${activeMode === filter.value ? 'mode-tab--active' : ''}`}
              onClick={() => setActiveMode(filter.value)}
            >
              {Icon && <Icon size={16} />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="freight-results-info">
        <span>{filteredRates.length} rates found</span>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="freight-cards-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card-static" style={{ padding: 24 }}>
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '60%', height: 24 }} />
            </div>
          ))}
        </div>
      ) : filteredRates.length > 0 ? (
        <div className="freight-cards-grid">
          {filteredRates.map((rate, index) => (
            <FreightRateCard key={rate.id || index} rate={rate} />
          ))}
        </div>
      ) : (
        <div className="freight-empty glass-card-static">
          <p>No freight rates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default FreightRates;
