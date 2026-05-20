import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import './SearchBar.css';

function SearchBar({ onSearch, onFilterChange, filters = [], activeFilter }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((value) => {
      if (onSearch) onSearch(value);
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar glass-card-static">
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          className="search-bar-input"
          placeholder="Search shipments, tracking numbers, carriers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-bar-clear" onClick={() => setQuery('')}>
            <X size={16} />
          </button>
        )}
        {filters.length > 0 && (
          <button
            className={`search-bar-filter-btn ${showFilters ? 'search-bar-filter-btn--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="search-bar-filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className={`search-filter-chip ${activeFilter === filter.value ? 'search-filter-chip--active' : ''}`}
              onClick={() => onFilterChange?.(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
