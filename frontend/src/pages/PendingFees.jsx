import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, CreditCard } from 'lucide-react';
import { dataService } from '../services/dataService';
import DataTable from '../components/DataTable';

const PendingFees = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [pendingReport, setPendingReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial sessions data
  useEffect(() => {
    const fetchSessionsData = async () => {
      try {
        setLoading(true);
        const list = await dataService.getSessions();
        setSessions(list);
        
        const active = list.find(s => s.active) || list[0];
        if (active) {
          setSelectedSession(active.year);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionsData();
  }, []);

  // 2. Fetch pending fees report dynamically when session changes
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedSession) return;
      try {
        setLoading(true);
        const report = await dataService.getPendingFeesReport(selectedSession);
        setPendingReport(report || []);
      } catch (err) {
        console.error('Error fetching pending report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedSession]);

  // List unique classes in pending database for filtering
  const classesList = useMemo(() => {
    const classes = pendingReport.map(item => item.class.split('-')[0].trim());
    return [...new Set(classes)].sort();
  }, [pendingReport]);

  // Apply filters
  const filteredReport = useMemo(() => {
    return pendingReport.filter(item => {
      if (!selectedClass) return true;
      return item.class.startsWith(selectedClass);
    });
  }, [pendingReport, selectedClass]);

  // Sum total outstanding pending amount
  const totalOutstandingAmount = useMemo(() => {
    return filteredReport.reduce((acc, item) => acc + item.pendingAmount, 0);
  }, [filteredReport]);

  // DataTable columns definition
  const columns = [
    {
      header: 'Admission No',
      key: 'admissionNo',
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{row.admissionNo}</span>
    },
    {
      header: 'Student Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <Link to={`/students/${row.admissionNo}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          {row.name}
        </Link>
      )
    },
    {
      header: 'Class & Section',
      key: 'class',
      sortable: true
    },
    {
      header: 'Session',
      key: 'sessionYear',
      sortable: true
    },
    {
      header: 'Outstanding Month(s)',
      key: 'pendingMonths',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '280px' }}>
          {row.pendingMonths.map((m, idx) => (
            <span 
              key={idx} 
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-text)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              {m}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Pending Balance',
      key: 'pendingAmount',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>
          ₹{row.pendingAmount.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
          <Link to={`/students/${row.admissionNo}`} className="btn btn-secondary btn-icon" title="View Profile" style={{ padding: '0.375rem' }}>
            <Eye size={14} />
          </Link>
          <Link 
            to={`/collect?studentId=${row.admissionNo}`} 
            className="btn btn-primary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem' }}
          >
            <CreditCard size={12} />
            Pay Fees
          </Link>
        </div>
      )
    }
  ];

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Pending Tuition Fees</h1>
          <p className="page-subtitle">Track students with outstanding fee deficits in the system</p>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid-stats" style={{ gridTemplateColumns: '1fr', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)', maxWidth: '400px' }}>
          <div className="stat-icon danger">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Outstanding Deficit</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>
              ₹{totalOutstandingAmount.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Across {filteredReport.length} student accounts
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-item">
          <label htmlFor="pendingSessionSelect">Session:</label>
          <select 
            id="pendingSessionSelect"
            className="form-control form-select" 
            style={{ width: '130px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="pendingClassSelect">Class:</label>
          <select 
            id="pendingClassSelect"
            className="form-control form-select" 
            style={{ width: '130px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {selectedClass && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => setSelectedClass('')}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Pending Accounts Data Table */}
      {loading ? (
        <div style={{ display: 'flex', minHeight: '30vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2.5px solid var(--primary-light)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Calculating outstanding balances...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredReport}
          searchPlaceholder="Search pending students by name or admission number..."
          searchKeys={['name', 'admissionNo']}
          emptyStateTitle="No Outstanding Accounts"
          emptyStateDesc="Great job! All student fee collections are up to date for this session selection."
        />
      )}
    </div>
  );
};

export default PendingFees;
