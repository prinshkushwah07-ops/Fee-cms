import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Coins, 
  Wallet, 
  AlertTriangle, 
  UserCheck, 
  Printer,
  ChevronRight
} from 'lucide-react';
import { dataService } from '../services/dataService';

const Reports = () => {
  // Data State
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  // Active Report Selector State
  const [activeReport, setActiveReport] = useState('daily');

  // Dynamic Filter Parameters State
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().substring(0, 7)); // "YYYY-MM"
  const [filterSession, setFilterSession] = useState('');
  const [filterMode, setFilterMode] = useState('Cash');
  const [filterStudentId, setFilterStudentId] = useState('');

  // 1. Fetch sessions & students on mount
  useEffect(() => {
    const initReports = async () => {
      try {
        setLoading(true);
        const studentList = await dataService.getStudents();
        const sessionList = await dataService.getSessions();
        const active = sessionList.find(s => s.active);

        setStudents(studentList);
        setSessions(sessionList);
        
        if (active) {
          setFilterSession(active.year);
        } else if (sessionList.length > 0) {
          setFilterSession(sessionList[0].year);
        }
      } catch (err) {
        console.error('Error initializing reports list:', err);
      } finally {
        setLoading(false);
      }
    };

    initReports();
  }, []);

  // 2. Fetch report data dynamically whenever filters change
  useEffect(() => {
    const loadReportData = async () => {
      // Avoid loading if bootstrap sessions not fetched yet
      if (sessions.length === 0) return;

      try {
        setReportLoading(true);
        let data = null;

        switch (activeReport) {
          case 'daily':
            data = await dataService.getDailyCollectionReport(filterDate);
            break;
          case 'monthly':
            data = await dataService.getMonthlyCollectionReport(filterMonth);
            break;
          case 'session':
            data = await dataService.getSessionCollectionReport(filterSession);
            break;
          case 'mode':
            data = await dataService.getModeCollectionReport(filterMode);
            break;
          case 'pending':
            data = await dataService.getPendingFeesReport(filterSession);
            break;
          case 'student':
            if (filterStudentId) {
              data = await dataService.getStudentWiseReport(filterStudentId);
            }
            break;
          default:
            data = [];
        }

        setReportData(data);
      } catch (err) {
        console.error('Error generating report:', err);
      } finally {
        setReportLoading(false);
      }
    };

    loadReportData();
  }, [activeReport, filterDate, filterMonth, filterSession, filterMode, filterStudentId, sessions]);

  // 3. Report configurations
  const reportsList = [
    { id: 'daily', name: 'Daily Collection', icon: Calendar, desc: 'View collection logs for a specific calendar date' },
    { id: 'monthly', name: 'Monthly Collection', icon: BarChart3, desc: 'Sum payment details for a specific calendar month' },
    { id: 'session', name: 'Session-wise Collection', icon: Coins, desc: 'Analyze total income statement for a academic session' },
    { id: 'mode', name: 'Cash vs UPI Collection', icon: Wallet, desc: 'Filter payments by Cash or UPI transaction modes' },
    { id: 'pending', name: 'Pending Fees Report', icon: AlertTriangle, desc: 'Extract accounts currently in arrears' },
    { id: 'student', name: 'Student Statement', icon: UserCheck, desc: 'Examine complete financial statement for a student' }
  ];

  // 4. Calculate Aggregates
  const totals = useMemo(() => {
    if (!reportData) return { totalFee: 0, paid: 0, pending: 0 };

    if (activeReport === 'student') {
      const payments = reportData.payments || [];
      const totalPaid = payments.reduce((acc, p) => acc + p.paidAmount, 0);
      const totalFee = payments.reduce((acc, p) => acc + p.totalFee, 0);
      return {
        totalFee,
        paid: totalPaid,
        pending: Math.max(0, totalFee - totalPaid)
      };
    }

    if (activeReport === 'pending') {
      const totalPending = reportData.reduce((acc, item) => acc + item.pendingAmount, 0);
      return { totalFee: totalPending, paid: 0, pending: totalPending };
    }

    // Standard payment logs list (daily, monthly, session, mode)
    const paid = reportData.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalFee = reportData.reduce((acc, p) => acc + p.totalFee, 0);
    const pending = reportData.reduce((acc, p) => acc + p.pendingAmount, 0);

    return { totalFee, paid, pending };
  }, [reportData, activeReport]);

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--primary-light)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configuring reports module...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Financial Accounts Reports</h1>
          <p className="page-subtitle">Compile and review collection summaries, modes, and student logs in SQL</p>
        </div>
        {reportData && (
          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <Printer size={16} />
            Print Report
          </button>
        )}
      </div>

      {/* Main Grid: Sidebar + Report Canvas */}
      <div className="reports-grid">
        
        {/* Left Side: Navigation Sidebar of Report templates */}
        <div className="card" style={{ padding: '0.75rem', margin: 0 }}>
          <div style={{ padding: '0.75rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
            Select Report Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
            {reportsList.map(rep => {
              const IconComp = rep.icon;
              const isActive = activeReport === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => {
                    setActiveReport(rep.id);
                    // Preselect first student if opening student report
                    if (rep.id === 'student' && students.length > 0) {
                      setFilterStudentId(students[0].admissionNo);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <IconComp size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span>{rep.name}</span>
                  </div>
                  <ChevronRight size={14} style={{ opacity: isActive ? 1 : 0 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Filters configuration + Table logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Filters configuration card */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>
              {reportsList.find(r => r.id === activeReport)?.name} Configs
            </h3>

            {/* Daily Collection Date Picker */}
            {activeReport === 'daily' && (
              <div className="form-group" style={{ maxWidth: '250px', marginBottom: 0 }}>
                <label className="form-label" htmlFor="dailyDatePicker">Select Date:</label>
                <input
                  id="dailyDatePicker"
                  type="date"
                  className="form-control"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            )}

            {/* Monthly Collection Month Picker */}
            {activeReport === 'monthly' && (
              <div className="form-group" style={{ maxWidth: '250px', marginBottom: 0 }}>
                <label className="form-label" htmlFor="monthlyMonthPicker">Select Month:</label>
                <input
                  id="monthlyMonthPicker"
                  type="month"
                  className="form-control"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              </div>
            )}

            {/* Session dropdown Picker */}
            {(activeReport === 'session' || activeReport === 'pending') && (
              <div className="form-group" style={{ maxWidth: '250px', marginBottom: 0 }}>
                <label className="form-label" htmlFor="sessionReportSelect">Select Session:</label>
                <select
                  id="sessionReportSelect"
                  className="form-control form-select"
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                >
                  {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
                </select>
              </div>
            )}

            {/* Mode selection Radio */}
            {activeReport === 'mode' && (
              <div className="form-group" style={{ maxWidth: '250px', marginBottom: 0 }}>
                <label className="form-label" htmlFor="modeReportSelect">Payment Mode:</label>
                <select
                  id="modeReportSelect"
                  className="form-control form-select"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            )}

            {/* Student selection Dropdown */}
            {activeReport === 'student' && (
              <div className="form-group" style={{ maxWidth: '350px', marginBottom: 0 }}>
                <label className="form-label" htmlFor="studentReportSelect">Select Student:</label>
                <select
                  id="studentReportSelect"
                  className="form-control form-select"
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.admissionNo} value={s.admissionNo}>
                      {s.name} ({s.admissionNo}) - Class {s.class}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Compiled Report Metrics & Tables */}
          {activeReport === 'student' && !filterStudentId ? (
            <div className="empty-state">
              <UserCheck size={48} className="empty-state-icon" />
              <h4 className="empty-state-title">Select Student</h4>
              <p className="empty-state-desc">Choose a student from the configuration dropdown to load their complete transaction history statement.</p>
            </div>
          ) : reportLoading ? (
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
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Compiling database records...</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Aggregated totals banner */}
              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {activeReport !== 'pending' && (
                  <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                    <div className="stat-info">
                      <span className="stat-label">Expected Total</span>
                      <span className="stat-value" style={{ fontSize: '1.25rem' }}>₹{totals.totalFee.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
                
                {activeReport !== 'pending' && (
                  <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                    <div className="stat-info">
                      <span className="stat-label" style={{ color: 'var(--success)' }}>Total Collected</span>
                      <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--success-text)' }}>
                        ₹{totals.paid.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="stat-info">
                    <span className="stat-label" style={{ color: 'var(--danger)' }}>Outstanding Due</span>
                    <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--danger-text)' }}>
                      ₹{totals.pending.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Logs Table */}
              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Compiled Records Sheet</h3>
                
                <div className="table-container" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
                  {activeReport === 'pending' ? (
                    // Rendering pending report structure
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Admission No</th>
                          <th>Student Name</th>
                          <th>Class</th>
                          <th>Session</th>
                          <th>Outstanding Month(s)</th>
                          <th style={{ textAlign: 'right' }}>Pending Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.map((row, idx) => (
                          <tr key={idx}>
                            <td><span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{row.admissionNo}</span></td>
                            <td>
                              <Link to={`/students/${row.admissionNo}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                {row.name}
                              </Link>
                            </td>
                            <td>{row.class}</td>
                            <td>{row.sessionYear}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', padding: '2px 4px', borderRadius: '3px' }}>
                                {row.pendingMonths.join(', ')}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger-text)' }}>
                              ₹{row.pendingAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                        {(!reportData || reportData.length === 0) && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No pending fees recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    // Rendering payment logs report structure
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Admission No</th>
                          <th>Student Name</th>
                          <th>Paid Month(s)</th>
                          <th>Mode</th>
                          <th>Date</th>
                          <th>Total Fee</th>
                          <th style={{ textAlign: 'right' }}>Paid Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeReport === 'student' ? reportData?.payments : reportData)?.map((row) => (
                          <tr key={row.receiptNo}>
                            <td><span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{row.receiptNo}</span></td>
                            <td>{row.studentId}</td>
                            <td>{row.studentName}</td>
                            <td>
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {row.months.join(', ')}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${row.paymentMode === 'UPI' ? 'badge-info' : 'badge-success'}`}>
                                {row.paymentMode}
                              </span>
                            </td>
                            <td>{row.paymentDate ? row.paymentDate.split('T')[0] : ''}</td>
                            <td>₹{row.totalFee.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success-text)' }}>
                              ₹{row.paidAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                        {((activeReport === 'student' ? reportData?.payments?.length : reportData?.length) === 0 || !reportData) && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No transactions match the selected configuration.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Reports;
