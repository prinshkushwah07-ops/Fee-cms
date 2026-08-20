import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  UserSquare2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { dataService } from '../services/dataService';

const StudentDetail = () => {
  const { admissionNo } = useParams();

  const [student, setStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [paidMonthsMap, setPaidMonthsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Academic months order
  const ACADEMIC_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const data = await dataService.getStudentByAdmissionNo(admissionNo);
        setStudent(data);

        if (data) {
          const report = await dataService.getStudentWiseReport(admissionNo);
          setStudentReport(report);

          const monthsMap = await dataService.getStudentPaidMonths(admissionNo, data.sessionYear);
          setPaidMonthsMap(monthsMap);
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [admissionNo]);

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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fetching profile statement...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ textAlign: 'left' }}>
        <Link to="/students" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>
        <div className="empty-state">
          <AlertCircle size={48} className="empty-state-icon" style={{ color: 'var(--danger)' }} />
          <h4 className="empty-state-title">Student Profile Not Found</h4>
          <p className="empty-state-desc">The student record with admission number <strong>{admissionNo}</strong> could not be located in our system database.</p>
          <Link to="/students" className="btn btn-primary">Go to Student Directory</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Back button and profile actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/students" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Directory
        </Link>
        <Link to={`/collect?studentId=${student.admissionNo}`} className="btn btn-primary">
          <CreditCard size={16} />
          Record Fee Payment
        </Link>
      </div>

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Personal Information Profile Card */}
        <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            margin: '0 auto 1rem auto',
            border: '2px solid white',
            boxShadow: 'var(--shadow-md)'
          }}>
            {student.name.charAt(0)}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>{student.name}</h3>
          <span className="badge badge-info" style={{ marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            {student.admissionNo}
          </span>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <UserSquare2 size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Parents</span>
                <strong>F:</strong> {student.fatherName} <br />
                <strong>M:</strong> {student.motherName}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <Phone size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
                <strong>{student.mobile}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Residential Address</span>
                <strong>{student.address}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Enrollment Details</span>
                Class {student.class} ({student.section}) <br />
                Admission: {student.admissionDate ? student.admissionDate.split('T')[0] : ''} <br />
                Session: {student.sessionYear}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Month-wise Fees & Payment logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Month Wise check sheet */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Monthly Fee Status Sheet ({student.sessionYear})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {ACADEMIC_MONTHS.map(month => {
                const record = paidMonthsMap[month];
                let bg = 'var(--danger-light)';
                let color = 'var(--danger-text)';
                let status = 'Pending';
                let icon = <AlertCircle size={14} />;

                if (record) {
                  if (record.status === 'Paid') {
                    bg = 'var(--success-light)';
                    color = 'var(--success-text)';
                    status = 'Paid';
                    icon = <CheckCircle2 size={14} />;
                  } else {
                    bg = 'var(--warning-light)';
                    color = 'var(--warning-text)';
                    status = 'Partial';
                    icon = <HelpCircle size={14} />;
                  }
                }

                return (
                  <div 
                    key={month} 
                    style={{
                      backgroundColor: bg,
                      color: color,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0,0,0,0.03)',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{month}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
                      {icon}
                      {status}
                    </div>
                    {record && (
                      <Link 
                        to={`/receipt/${record.receiptNo}`} 
                        style={{ fontSize: '0.6875rem', color: 'inherit', fontWeight: 700, textDecoration: 'underline', marginTop: '0.375rem' }}
                      >
                        Receipt
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Specific Payment History */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Fee Collection History
            </h3>
            
            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Paid Months</th>
                    <th>Total Month Fee</th>
                    <th>Paid Amount</th>
                    <th>Pending Amount</th>
                    <th>Mode</th>
                    <th>Payment Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport?.payments.map((tx) => (
                    <tr key={tx.receiptNo}>
                      <td><span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{tx.receiptNo}</span></td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {tx.months.join(', ')}
                        </span>
                      </td>
                      <td>₹{tx.totalFee.toLocaleString('en-IN')}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--success-text)' }}>₹{tx.paidAmount.toLocaleString('en-IN')}</span></td>
                      <td>
                        {tx.pendingAmount > 0 ? (
                          <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>₹{tx.pendingAmount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${tx.paymentMode === 'UPI' ? 'badge-info' : 'badge-success'}`}>
                          {tx.paymentMode}
                        </span>
                      </td>
                      <td>{tx.paymentDate ? tx.paymentDate.split('T')[0] : ''}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link 
                          to={`/receipt/${tx.receiptNo}`} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem' }}
                        >
                          <Eye size={12} />
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!studentReport?.payments || studentReport.payments.length === 0) && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No fee payments recorded for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
