import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Filter } from 'lucide-react';
import { dataService } from '../services/dataService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const PaymentHistory = () => {
  const { showToast } = useToast();

  // Data State
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  // Modals States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activePayment, setActivePayment] = useState(null);

  // Edit fields state
  const [editFormData, setEditFormData] = useState({
    paidAmount: '',
    paymentDate: '',
    paymentMode: 'Cash'
  });
  const [editError, setEditError] = useState('');

  // Academic months list
  const ACADEMIC_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const paymentList = await dataService.getPayments();
      const sessionList = await dataService.getSessions();
      setPayments(paymentList);
      setSessions(sessionList);
    } catch (err) {
      showToast('Error', 'Failed to load transaction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSession = selectedSession ? p.sessionYear === selectedSession : true;
      const matchMonth = selectedMonth ? p.months.includes(selectedMonth) : true;
      const matchMode = selectedMode ? p.paymentMode === selectedMode : true;
      return matchSession && matchMonth && matchMode;
    });
  }, [payments, selectedSession, selectedMonth, selectedMode]);

  // Open Edit Modal
  const handleOpenEdit = (payment) => {
    setActivePayment(payment);
    setEditFormData({
      paidAmount: payment.paidAmount.toString(),
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      paymentMode: payment.paymentMode
    });
    setEditError('');
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(editFormData.paidAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setEditError('Paid amount must be a positive number');
      return;
    }
    if (amount > activePayment.totalFee) {
      setEditError(`Paid amount cannot exceed total fee amount (Max: ₹${activePayment.totalFee})`);
      return;
    }

    try {
      await dataService.updatePayment(activePayment.receiptNo, {
        paidAmount: amount,
        paymentDate: editFormData.paymentDate,
        paymentMode: editFormData.paymentMode
      });
      await loadData();
      setIsEditOpen(false);
      showToast('Payment Record Updated', `Receipt ${activePayment.receiptNo} updated successfully.`, 'success');
    } catch (err) {
      setEditError(err.message);
      showToast('Error', err.message, 'error');
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (payment) => {
    setActivePayment(payment);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await dataService.deletePayment(activePayment.receiptNo);
      await loadData();
      showToast('Payment Record Deleted', `Receipt ${activePayment.receiptNo} was deleted successfully.`, 'success');
    } catch (err) {
      showToast('Deletion Error', err.message, 'error');
    }
  };

  // DataTable columns definition
  const columns = [
    {
      header: 'Receipt No',
      key: 'receiptNo',
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{row.receiptNo}</span>
    },
    {
      header: 'Student Name',
      key: 'studentName',
      sortable: true,
      render: (row) => (
        <Link to={`/students/${row.studentId}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          {row.studentName}
        </Link>
      )
    },
    {
      header: 'Admission No',
      key: 'studentId',
      sortable: true
    },
    {
      header: 'Session',
      key: 'sessionYear',
      sortable: true
    },
    {
      header: 'Fee Month(s)',
      key: 'months',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {row.months.join(', ')} ({row.months.length} mon)
        </span>
      )
    },
    {
      header: 'Paid Amount',
      key: 'paidAmount',
      sortable: true,
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{row.paidAmount.toLocaleString('en-IN')}</span>
    },
    {
      header: 'Payment Mode',
      key: 'paymentMode',
      sortable: true,
      render: (row) => (
        <span className={`badge ${row.paymentMode === 'UPI' ? 'badge-info' : 'badge-success'}`}>
          {row.paymentMode}
        </span>
      )
    },
    {
      header: 'Payment Date',
      key: 'paymentDate',
      sortable: true,
      render: (row) => row.paymentDate ? row.paymentDate.split('T')[0] : ''
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-start' }}>
          <Link to={`/receipt/${row.receiptNo}`} className="btn btn-secondary btn-icon" title="View & Print Receipt" style={{ padding: '0.375rem' }}>
            <Eye size={14} />
          </Link>
          <button className="btn btn-secondary btn-icon" title="Edit Transaction" style={{ padding: '0.375rem' }} onClick={() => handleOpenEdit(row)}>
            <Edit size={14} />
          </button>
          <button className="btn btn-secondary btn-icon" title="Delete Transaction" style={{ padding: '0.375rem', color: 'var(--danger)' }} onClick={() => handleOpenDelete(row)}>
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ textAlignment: 'left', textAlign: 'left' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Payment Transaction History</h1>
          <p className="page-subtitle">Search, filter, edit, or print receipt invoices for past fee collections</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginRight: '0.5rem' }}>
          <Filter size={16} />
          <span>Filters:</span>
        </div>

        <div className="filter-item">
          <label htmlFor="selectSession">Session:</label>
          <select 
            id="selectSession"
            className="form-control form-select" 
            style={{ width: '130px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <option value="">All Sessions</option>
            {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="selectMonth">Month:</label>
          <select 
            id="selectMonth"
            className="form-control form-select" 
            style={{ width: '140px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {ACADEMIC_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="selectMode">Payment Mode:</label>
          <select 
            id="selectMode"
            className="form-control form-select" 
            style={{ width: '120px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
          >
            <option value="">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        {(selectedSession || selectedMonth || selectedMode) && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => { setSelectedSession(''); setSelectedMonth(''); setSelectedMode(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Data Table */}
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading payments log...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
          searchPlaceholder="Search by receipt no, student name, or admission id..."
          searchKeys={['receiptNo', 'studentName', 'studentId']}
          emptyStateTitle="No Payments Recorded"
          emptyStateDesc="Try selecting different filter options or check student directory logs."
        />
      )}

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Transaction Receipt: ${activePayment?.receiptNo}`}
        size="small"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          {activePayment && (
            <div style={{ fontSize: '0.8125rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <div>Student: <strong>{activePayment.studentName} ({activePayment.studentId})</strong></div>
              <div>Session: <strong>{activePayment.sessionYear}</strong></div>
              <div>Paid Months: <strong>{activePayment.months.join(', ')}</strong></div>
              <div>Invoice Max Limit: <strong>₹{activePayment.totalFee}</strong></div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="editPaidAmountInput">Paid Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="editPaidAmountInput"
              type="number"
              className="form-control"
              value={editFormData.paidAmount}
              onChange={(e) => setEditFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="editPaymentDateInput">Payment Date <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="editPaymentDateInput"
              type="date"
              className="form-control"
              value={editFormData.paymentDate}
              onChange={(e) => setEditFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label className="form-check" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  className="form-check-input"
                  name="editMode"
                  value="Cash"
                  checked={editFormData.paymentMode === 'Cash'}
                  onChange={() => setEditFormData(prev => ({ ...prev, paymentMode: 'Cash' }))}
                />
                <span style={{ fontSize: '0.875rem' }}>Cash</span>
              </label>
              <label className="form-check" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  className="form-check-input"
                  name="editMode"
                  value="UPI"
                  checked={editFormData.paymentMode === 'UPI'}
                  onChange={() => setEditFormData(prev => ({ ...prev, paymentMode: 'UPI' }))}
                />
                <span style={{ fontSize: '0.875rem' }}>UPI</span>
              </label>
            </div>
          </div>

          {editError && <span className="form-feedback-error" style={{ marginTop: '0.5rem' }}>{editError}</span>}
        </form>
      </Modal>

      {/* Delete Confirmation Dialogue */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction Record"
        message={`Are you sure you want to delete transaction receipt "${activePayment?.receiptNo}"? This will reset the student's monthly fee checks back to unpaid.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default PaymentHistory;
