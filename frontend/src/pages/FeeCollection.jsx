import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Info, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';

const FeeCollection = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Data State
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State variables
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Paid months lookup map
  const [paidMonthsMap, setPaidMonthsMap] = useState({});

  // Validation errors
  const [errors, setErrors] = useState({});

  // Academic months list
  const ACADEMIC_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  // 1. Fetch Students and Sessions on mount
  useEffect(() => {
    const initForm = async () => {
      try {
        setLoading(true);
        const studentList = await dataService.getStudents();
        const sessionList = await dataService.getSessions();
        const active = sessionList.find(s => s.active);

        setStudents(studentList);
        setSessions(sessionList);

        // Preselect student from URL query parameter
        const params = new URLSearchParams(location.search);
        const urlStudentId = params.get('studentId');
        if (urlStudentId && studentList.some(s => s.admissionNo === urlStudentId)) {
          setSelectedStudentId(urlStudentId);
        }

        // Set default session
        if (active) {
          setSelectedSession(active.year);
        } else if (sessionList.length > 0) {
          setSelectedSession(sessionList[0].year);
        }
      } catch (err) {
        showToast('Error', 'Failed to load form lookup data', 'error');
      } finally {
        setLoading(false);
      }
    };

    initForm();
  }, [location.search]);

  // 2. Fetch paid months dynamically when student or session changes
  useEffect(() => {
    const loadPaidMonths = async () => {
      if (!selectedStudentId || !selectedSession) {
        setPaidMonthsMap({});
        return;
      }
      try {
        const map = await dataService.getStudentPaidMonths(selectedStudentId, selectedSession);
        setPaidMonthsMap(map);
      } catch (err) {
        console.error('Error loading paid months:', err);
      }
    };

    loadPaidMonths();
  }, [selectedStudentId, selectedSession]);

  // 3. Reactive calculations based on selected student
  const student = useMemo(() => {
    return students.find(s => s.admissionNo === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  const monthlyFee = student ? student.monthlyFee : 0;
  const totalMonths = selectedMonths.length;
  const totalFee = monthlyFee * totalMonths;

  // Sync paidAmount default when totalFee changes
  useEffect(() => {
    setPaidAmount(totalFee > 0 ? totalFee.toString() : '');
  }, [totalFee]);

  // Handle month checkbox toggles
  const handleMonthToggle = (month) => {
    // If month is already fully paid, prevent selecting it
    if (paidMonthsMap[month] && paidMonthsMap[month].status === 'Paid') {
      showToast('Already Paid', `${month} fee is already paid for this student.`, 'warning');
      return;
    }

    setErrors(prev => ({ ...prev, months: '' }));
    
    if (selectedMonths.includes(month)) {
      setSelectedMonths(prev => prev.filter(m => m !== month));
    } else {
      setSelectedMonths(prev => [...prev, month]);
    }
  };

  const pendingAmount = useMemo(() => {
    const amt = Number(paidAmount) || 0;
    return Math.max(0, totalFee - amt);
  }, [totalFee, paidAmount]);

  // Form Validation
  const validateForm = () => {
    const err = {};
    if (!selectedStudentId) err.student = 'Please select a student';
    if (!selectedSession) err.session = 'Please select an academic session';
    if (selectedMonths.length === 0) err.months = 'Please select at least one month';
    
    if (paidAmount === '' || paidAmount === null) {
      err.paidAmount = 'Paid amount is required';
    } else {
      const amt = Number(paidAmount);
      if (isNaN(amt) || amt < 0) {
        err.paidAmount = 'Paid amount must be a positive number';
      } else if (amt > totalFee) {
        err.paidAmount = `Paid amount cannot exceed total fee (Max: ₹${totalFee})`;
      }
    }

    if (!paymentDate) err.paymentDate = 'Payment date is required';
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Submit Payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await dataService.recordPayment({
        studentId: selectedStudentId,
        sessionYear: selectedSession,
        months: selectedMonths,
        monthlyFee,
        totalFee,
        paidAmount: Number(paidAmount),
        paymentDate,
        paymentMode
      });

      showToast('Fee Receipt Generated', `Payment of ₹${paidAmount} recorded successfully.`, 'success');
      navigate(`/receipt/${result.receiptNo}`);
    } catch (err) {
      showToast('Transaction Failed', err.message, 'error');
    }
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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Preparing transaction interface...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Title */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Record Fee Payment</h1>
          <p className="page-subtitle">Select a student, choose pending months, and log fee payments into SQL server</p>
        </div>
      </div>

      <div className="fee-collection-grid">
        
        {/* Main Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Student selection field */}
            <div className="form-group">
              <label className="form-label" htmlFor="studentSelect">Select Student <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                id="studentSelect"
                className="form-control form-select"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setSelectedMonths([]); // Reset selected months when student changes
                  setErrors({});
                }}
              >
                <option value="">-- Select Enrolled Student --</option>
                {students.map(s => (
                  <option key={s.admissionNo} value={s.admissionNo}>
                    {s.name} ({s.admissionNo}) - Class {s.class}
                  </option>
                ))}
              </select>
              {errors.student && <span className="form-feedback-error">{errors.student}</span>}
            </div>

            {/* Session selection field */}
            <div className="form-group">
              <label className="form-label" htmlFor="sessionSelect">Academic Session Year <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                id="sessionSelect"
                className="form-control form-select"
                value={selectedSession}
                onChange={(e) => {
                  setSelectedSession(e.target.value);
                  setSelectedMonths([]); // Reset months when session changes
                  setErrors({});
                }}
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.year}>{s.year}</option>
                ))}
              </select>
              {errors.session && <span className="form-feedback-error">{errors.session}</span>}
            </div>

            {/* Month-wise Checkboxes selection */}
            {selectedStudentId && (
              <div className="form-group">
                <label className="form-label">Select Months to Pay <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {ACADEMIC_MONTHS.map(month => {
                    const statusRecord = paidMonthsMap[month];
                    const isFullyPaid = statusRecord?.status === 'Paid';
                    const isPartiallyPaid = statusRecord?.status === 'Partially Paid';
                    const isChecked = selectedMonths.includes(month);

                    let labelColor = 'var(--text-main)';
                    let borderCol = 'var(--border-color)';
                    let badge = null;

                    if (isFullyPaid) {
                      labelColor = 'var(--text-muted)';
                      borderCol = '#e2e8f0';
                      badge = <span style={{ fontSize: '0.625rem', color: 'var(--success-text)', backgroundColor: 'var(--success-light)', padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto' }}>Paid</span>;
                    } else if (isPartiallyPaid) {
                      labelColor = 'var(--warning-text)';
                      borderCol = 'var(--warning)';
                      badge = <span style={{ fontSize: '0.625rem', color: 'var(--warning-text)', backgroundColor: 'var(--warning-light)', padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto' }}>Partial</span>;
                    }

                    return (
                      <label 
                        key={month}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          border: isChecked ? '1px solid var(--primary)' : `1px solid ${borderCol}`,
                          backgroundColor: isChecked ? 'var(--primary-light)' : 'white',
                          borderRadius: 'var(--radius-md)',
                          cursor: isFullyPaid ? 'not-allowed' : 'pointer',
                          opacity: isFullyPaid ? 0.6 : 1,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: labelColor,
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isChecked}
                          onChange={() => handleMonthToggle(month)}
                          disabled={isFullyPaid}
                          style={{ cursor: isFullyPaid ? 'not-allowed' : 'pointer' }}
                        />
                        <span>{month}</span>
                        {badge}
                      </label>
                    );
                  })}
                </div>
                {errors.months && <span className="form-feedback-error">{errors.months}</span>}
              </div>
            )}

            {/* Calculations Fields Grid */}
            {selectedMonths.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Total Payable Amount (₹)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={totalFee}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', fontWeight: 700, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Paid Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter collected amount"
                    value={paidAmount}
                    onChange={(e) => {
                      setPaidAmount(e.target.value);
                      setErrors(prev => ({ ...prev, paidAmount: '' }));
                    }}
                  />
                  {errors.paidAmount && <span className="form-feedback-error">{errors.paidAmount}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                  {errors.paymentDate && <span className="form-feedback-error">{errors.paymentDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label className="form-check" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        className="form-check-input"
                        name="paymentMode"
                        value="Cash"
                        checked={paymentMode === 'Cash'}
                        onChange={() => setPaymentMode('Cash')}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Cash</span>
                    </label>
                    <label className="form-check" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        className="form-check-input"
                        name="paymentMode"
                        value="UPI"
                        checked={paymentMode === 'UPI'}
                        onChange={() => setPaymentMode('UPI')}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>UPI</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Form Footer */}
            {selectedMonths.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedMonths([])}>Reset</button>
                <button type="submit" className="btn className btn-primary">
                  <CreditCard size={16} />
                  Record & Generate Receipt
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Box */}
          <div className="card" style={{ backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Invoice Summary</h3>
            
            {student ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', textAlign: 'left' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{student.name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Class / Section:</span>
                  <div style={{ fontWeight: 600 }}>{student.class} ({student.section})</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Tuition Fee:</span>
                  <div style={{ fontWeight: 600 }}>₹{student.monthlyFee.toLocaleString('en-IN')}</div>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Selected Months:</span>
                  <span style={{ fontWeight: 600 }}>{selectedMonths.length}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Total Payable:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{totalFee.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Paid Amount:</span>
                  <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>₹{(Number(paidAmount) || 0).toLocaleString('en-IN')}</span>
                </div>

                {pendingAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>Outstanding Balance:</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>₹{pendingAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'left' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Select a student from the directory dropdown to fetch invoice rates and due sheets.</span>
              </div>
            )}
          </div>

          {/* Pending Alerts */}
          {student && selectedMonths.length > 0 && pendingAmount > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)', padding: '1rem', margin: 0 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', textAlign: 'left' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0 }}>Partial Collection Warning</h4>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', lineHeight: '1.3' }}>
                    You are recording a partial fee of ₹{paidAmount} instead of ₹{totalFee}. An outstanding balance of <strong>₹{pendingAmount}</strong> will be logged under this student profile.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeCollection;
