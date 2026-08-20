import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Coins, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { 
  MonthlyCollectionChart, 
  PaymentModeChart, 
  PaidPendingChart 
} from '../components/CustomCharts';

const Dashboard = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [sessionPayments, setSessionPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch sessions & stats on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const session = await dataService.getActiveSession();
        setActiveSession(session);
        
        if (session) {
          const fetchedStats = await dataService.getDashboardStats(session.year);
          setStats(fetchedStats);

          const allPayments = await dataService.getPayments();
          setRecentTransactions(allPayments.slice(0, 5));
          
          const filteredPayments = allPayments.filter(p => p.sessionYear === session.year);
          setSessionPayments(filteredPayments);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const sessionYear = activeSession ? activeSession.year : '';

  // 2. Group collections by calendar months (Academic Order: Apr - Mar)
  const monthlyChartData = useMemo(() => {
    const ACADEMIC_MONTHS = [
      { name: 'April', num: 4 },
      { name: 'May', num: 5 },
      { name: 'June', num: 6 },
      { name: 'July', num: 7 },
      { name: 'August', num: 8 },
      { name: 'September', num: 9 },
      { name: 'October', num: 10 },
      { name: 'November', num: 11 },
      { name: 'December', num: 12 },
      { name: 'January', num: 1 },
      { name: 'February', num: 2 },
      { name: 'March', num: 3 }
    ];

    const monthlyValues = ACADEMIC_MONTHS.reduce((acc, m) => {
      acc[m.name] = 0;
      return acc;
    }, {});

    // Sum paid amounts by their payment date calendar month
    sessionPayments.forEach(p => {
      if (!p.paymentDate) return;
      const monthNum = parseInt(p.paymentDate.split('-')[1], 10);
      const monthObj = ACADEMIC_MONTHS.find(m => m.num === monthNum);
      if (monthObj) {
        monthlyValues[monthObj.name] += p.paidAmount;
      }
    });

    return ACADEMIC_MONTHS.map(m => ({
      label: m.name,
      value: monthlyValues[m.name]
    }));
  }, [sessionPayments]);

  // 3. Payment mode distribution (Cash vs UPI)
  const paymentModeData = useMemo(() => {
    let cash = 0;
    let upi = 0;
    sessionPayments.forEach(p => {
      if (p.paymentMode === 'Cash') {
        cash += p.paidAmount;
      } else {
        upi += p.paidAmount;
      }
    });
    return { cash, upi };
  }, [sessionPayments]);

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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Updating metrics...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-state-icon" />
        <h4 className="empty-state-title">No Academic Term Set</h4>
        <p className="empty-state-desc">Please navigate to Session Years to create and activate a school term before viewing stats.</p>
        <Link to="/sessions" className="btn btn-primary">Go to Session Management</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Dashboard Overview</h1>
          <p className="page-subtitle">Real-time statistics for the academic session {sessionYear}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/students" className="btn btn-secondary">
            <Users size={16} />
            Manage Students
          </Link>
          <Link to="/collect" className="btn btn-primary">
            + Record Payment
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Fees Collected</span>
            <span className="stat-value">₹{stats.totalCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Fees</span>
            <span className="stat-value">₹{stats.totalPending.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon secondary">
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Today's Collection</span>
            <span className="stat-value">₹{stats.todayCollection.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Sub Stats Row */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div className="stat-icon warning" style={{ width: '2.5rem', height: '2.5rem' }}>
            <CalendarDays size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ fontSize: '0.6875rem' }}>Month Collection</span>
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>₹{stats.currentMonthCollection.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div className="stat-icon success" style={{ width: '2.5rem', height: '2.5rem' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ fontSize: '0.6875rem' }}>Paid Students</span>
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.paidStudentsCount}</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div className="stat-icon danger" style={{ width: '2.5rem', height: '2.5rem' }}>
            <AlertCircle size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ fontSize: '0.6875rem' }}>Pending Students</span>
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.pendingStudentsCount}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-charts">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Fee Collection</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Collections (₹)</span>
          </div>
          <MonthlyCollectionChart data={monthlyChartData} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="chart-card">
            <div className="chart-header" style={{ marginBottom: '0.75rem' }}>
              <h3 className="chart-title">Payment Modes</h3>
            </div>
            <PaymentModeChart cash={paymentModeData.cash} upi={paymentModeData.upi} />
          </div>
          <div className="chart-card">
            <div className="chart-header" style={{ marginBottom: '0.75rem' }}>
              <h3 className="chart-title">Collection Target</h3>
            </div>
            <PaidPendingChart paid={stats.totalCollected} pending={stats.totalPending} />
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 className="chart-title" style={{ fontSize: '1.125rem' }}>Recent Payment Transactions</h3>
          <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
            View All History
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Student Name</th>
                <th>Session</th>
                <th>Paid Months</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Payment Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.receiptNo}>
                  <td><span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{tx.receiptNo}</span></td>
                  <td>
                    <Link to={`/students/${tx.studentId}`} style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                      {tx.studentName}
                    </Link>
                  </td>
                  <td>{tx.sessionYear}</td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {tx.months.join(', ')}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{tx.paidAmount.toLocaleString('en-IN')}</span></td>
                  <td>
                    <span className={`badge ${tx.paymentMode === 'UPI' ? 'badge-info' : 'badge-success'}`}>
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td>{tx.paymentDate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link 
                      to={`/receipt/${tx.receiptNo}`} 
                      className="btn btn-secondary" 
                      style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem' }}
                    >
                      <Eye size={12} />
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No recent payments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
