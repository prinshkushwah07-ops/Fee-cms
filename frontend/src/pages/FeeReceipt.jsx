import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, AlertTriangle, GraduationCap } from 'lucide-react';
import { dataService } from '../services/dataService';

const FeeReceipt = () => {
  const { receiptNo } = useParams();

  const [payment, setPayment] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        const fetchedPayment = await dataService.getPaymentByReceiptNo(receiptNo);
        setPayment(fetchedPayment);

        if (fetchedPayment) {
          const fetchedStudent = await dataService.getStudentByAdmissionNo(fetchedPayment.studentId);
          setStudent(fetchedStudent);
        }
      } catch (err) {
        console.error('Error fetching receipt data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [receiptNo]);

  const handlePrint = () => {
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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Compiling receipt sheet...</span>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ textAlign: 'left' }}>
        <Link to="/history" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to History
        </Link>
        <div className="empty-state">
          <AlertTriangle size={48} className="empty-state-icon" style={{ color: 'var(--danger)' }} />
          <h4 className="empty-state-title">Receipt Invoice Not Found</h4>
          <p className="empty-state-desc">The transaction receipt <strong>{receiptNo}</strong> could not be located in our records.</p>
          <Link to="/history" className="btn btn-primary">Go to Payment History</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Receipts Control Panel (Hidden during printing) */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Fee Receipt Details</h1>
          <p className="page-subtitle">Official payment receipt for transaction index {receiptNo}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/history" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to History
          </Link>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Official Receipt Card Block */}
      <div className="receipt-wrapper">
        <div className="receipt-card">
          
          {/* School Header */}
          <div className="receipt-header">
            <div className="receipt-school-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <GraduationCap size={24} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>NEXVORA SCHOOL</h2>
              </div>
              <p>Plot 12, Education City, Knowledge Park, New Delhi</p>
              <p>Email: finance@nexvoraschool.edu | Phone: +91 11-45678901</p>
            </div>
            
            <div className="receipt-title-box">
              <h3>FEE RECEIPT</h3>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#64748b' }}>
                Receipt No: <strong>{payment.receiptNo}</strong>
              </div>
            </div>
          </div>

          {/* Metadata Block (Student & Payment Summary) */}
          <div className="receipt-meta-grid">
            <div className="receipt-meta-block">
              <h4>STUDENT PARTICULARS</h4>
              <div className="receipt-meta-row">
                <span>Student Name:</span>
                <span>{payment.studentName}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Admission Number:</span>
                <span>{payment.studentId}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Class & Section:</span>
                <span>{student ? `${student.class} - ${student.section}` : '-'}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Academic Session:</span>
                <span>{payment.sessionYear}</span>
              </div>
            </div>

            <div className="receipt-meta-block">
              <h4>TRANSACTION SUMMARY</h4>
              <div className="receipt-meta-row">
                <span>Payment Date:</span>
                <span>{payment.paymentDate ? payment.paymentDate.split('T')[0] : ''}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Payment Method:</span>
                <span style={{ fontWeight: 700 }}>{payment.paymentMode}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Collection Staff:</span>
                <span>Accounts Dept.</span>
              </div>
              <div className="receipt-meta-row">
                <span>Receipt Status:</span>
                <span style={{ 
                  color: payment.pendingAmount === 0 ? 'var(--success-text)' : 'var(--warning-text)',
                  fontWeight: 700
                }}>
                  {payment.pendingAmount === 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Items breakdown Table */}
          <div className="receipt-table-title">Breakdown description</div>
          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Fee Description</th>
                <th style={{ textAlign: 'center' }}>Rate</th>
                <th style={{ textAlign: 'center' }}>Months</th>
                <th style={{ textAlign: 'right' }}>Total amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>
                  Monthly Tuition Fees <br />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    Month(s) paid: {payment.months.join(', ')}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>₹{payment.monthlyFee.toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'center' }}>{payment.months.length}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{payment.totalFee.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Summary Totals */}
          <div className="receipt-total-section">
            <div className="receipt-total-box">
              <div className="receipt-total-row">
                <span>Invoice Total:</span>
                <span>₹{payment.totalFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="receipt-total-row">
                <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Collected Amount:</span>
                <span style={{ fontWeight: 700 }}>₹{payment.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              
              {payment.pendingAmount > 0 ? (
                <div className="receipt-total-row" style={{ borderTop: '1px solid #fed7d7' }}>
                  <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>Remaining Balance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>₹{payment.pendingAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="receipt-total-row" style={{ borderTop: '1px solid #d1fae5' }}>
                  <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Outstanding Balance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>₹0.00</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Signature fields */}
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'left', marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <strong>Terms & Notes:</strong>
            <p>1. This is a computer-generated invoice and requires no physical seal signatures under local audit codes.</p>
            <p>2. Fees once paid are non-refundable and non-transferable under standard institute policies.</p>
          </div>

          <div className="receipt-footer">
            <div className="receipt-sign-box">
              <div className="receipt-sign-line"></div>
              <div className="receipt-sign-label">Deposited By</div>
            </div>
            
            <div className="receipt-sign-box">
              <div className="receipt-sign-line"></div>
              <div className="receipt-sign-label">Cashier / Accountant</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeeReceipt;
