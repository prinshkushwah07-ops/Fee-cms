import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';

const DataTable = ({
  columns,
  data = [],
  searchPlaceholder = 'Search...',
  searchKeys = [], // keys in object to filter by search string
  itemsPerPage = 10,
  emptyStateTitle = 'No records found',
  emptyStateDesc = 'There are no items matching the criteria.'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on search change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // 1. Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery || searchKeys.length === 0) return data;
    
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (val === null || val === undefined) return false;
        
        if (Array.isArray(val)) {
          return val.some(v => String(v).toLowerCase().includes(query));
        }
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // 2. Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nested values if needed, or check undefined
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
      }
      return (aVal - bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Paginate Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Search Bar */}
      {searchKeys.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1.25rem', display: 'flex', maxWidth: '350px' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.25rem' }}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        {paginatedData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={48} />
            </div>
            <h4 className="empty-state-title">{emptyStateTitle}</h4>
            <p className="empty-state-desc">{emptyStateDesc}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(col.key, col.sortable)}
                    style={{
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: col.width || 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {col.header}
                      {col.sortable && sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing{' '}
            <strong>
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)}
            </strong>{' '}
            of <strong>{sortedData.length}</strong> records
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Only display around 5 pages if there are too many
              if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                if (page === 2 || page === totalPages - 1) {
                  return <span key={page} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem' }}>...</span>;
                }
                return null;
              }
              return (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '2.25rem', padding: '0.5rem 0.75rem' }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
