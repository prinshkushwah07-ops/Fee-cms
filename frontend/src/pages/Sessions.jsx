import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const Sessions = () => {
  const { showToast } = useToast();
  
  // Data State
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Dialogue States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Form Field State
  const [yearString, setYearString] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch data
  const loadSessions = async () => {
    try {
      setLoading(true);
      const list = await dataService.getSessions();
      setSessions(list);
    } catch (err) {
      showToast('Error', 'Failed to retrieve academic sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Validate session format YYYY-YY or YYYY-YYYY
  const validateSessionFormat = (val) => {
    const formatRegex = /^\d{4}-\d{2}$/;
    if (!val.trim()) {
      return 'Session Year is required';
    }
    if (!formatRegex.test(val.trim())) {
      return 'Invalid format. Must be like "2026-27" (YYYY-YY)';
    }
    const parts = val.split('-');
    const startYear = parseInt(parts[0], 10);
    const endYearSuffix = parseInt(parts[1], 10);
    const expectedSuffix = (startYear + 1) % 100;
    
    if (endYearSuffix !== expectedSuffix) {
      return `Invalid academic range. For start year ${startYear}, end suffix must be ${(startYear + 1).toString().slice(-2)}`;
    }

    return '';
  };

  // Set active session
  const handleSetActive = async (id) => {
    try {
      await dataService.setActiveSession(id);
      showToast('Active Session Updated', 'System academic session has been changed successfully.', 'success');
      // Force reload to update central AppLayout state immediately
      window.location.reload();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setYearString('');
    setFormError('');
    setIsAddOpen(true);
  };

  // Submit Add Session
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const error = validateSessionFormat(yearString);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      await dataService.addSession(yearString.trim());
      await loadSessions();
      setIsAddOpen(false);
      showToast('Session Added', `Academic session ${yearString} was created successfully.`, 'success');
    } catch (err) {
      setFormError(err.message);
      showToast('Creation Error', err.message, 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (session) => {
    setActiveItem(session);
    setYearString(session.year);
    setFormError('');
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const error = validateSessionFormat(yearString);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      await dataService.updateSession(activeItem.id, yearString.trim());
      await loadSessions();
      setIsEditOpen(false);
      showToast('Session Updated', `Academic session was updated to ${yearString}.`, 'success');
    } catch (err) {
      setFormError(err.message);
      showToast('Update Error', err.message, 'error');
    }
  };

  // Open Delete Confirm Dialogue
  const handleOpenDelete = (session) => {
    setActiveItem(session);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await dataService.deleteSession(activeItem.id);
      await loadSessions();
      showToast('Session Deleted', `Academic session ${activeItem.year} was removed successfully.`, 'success');
    } catch (err) {
      showToast('Deletion Error', err.message, 'error');
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Session Year Management</h1>
          <p className="page-subtitle">Configure academic sessions, set active school years, and validate layouts in SQLite</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          Create Session Year
        </button>
      </div>

      {/* Loader indicator */}
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading sessions...</span>
          </div>
        </div>
      ) : (
        /* Grid List of Sessions */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                height: '180px',
                margin: 0,
                border: session.active ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: session.active ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
              }}
            >
              {/* Session Info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: session.active ? 'var(--primary-light)' : 'var(--bg-main)',
                    color: session.active ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-dark)' }}>{session.year}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Term</span>
                  </div>
                </div>

                {session.active && (
                  <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.375rem 0.5rem' }}>
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                )}
              </div>

              {/* Actions Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                {!session.active ? (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                    onClick={() => handleSetActive(session.id)}
                  >
                    Set Active
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success-text)', fontWeight: 600 }}>Active Workspace</span>
                )}

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    className="btn btn-secondary btn-icon" 
                    title="Edit Session Year"
                    style={{ padding: '0.375rem' }} 
                    onClick={() => handleOpenEdit(session)}
                  >
                    <Edit size={12} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-icon" 
                    title="Delete Session Year"
                    style={{ padding: '0.375rem', color: 'var(--danger)' }} 
                    onClick={() => handleOpenDelete(session)}
                    disabled={session.active}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Academic Session"
        size="small"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddSubmit}>Create Session</button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="yearInput">Session Year (YYYY-YY) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="yearInput"
              type="text"
              className="form-control"
              placeholder="E.g. 2026-27"
              value={yearString}
              onChange={(e) => setYearString(e.target.value)}
            />
            <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Academic sessions start in April and end in March of the following calendar year.
            </span>
            {formError && <span className="form-feedback-error">{formError}</span>}
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Academic Session"
        size="small"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="editYearInput">Session Year (YYYY-YY) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="editYearInput"
              type="text"
              className="form-control"
              placeholder="E.g. 2026-27"
              value={yearString}
              onChange={(e) => setYearString(e.target.value)}
            />
            {formError && <span className="form-feedback-error">{formError}</span>}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialogue */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Session Year"
        message={`Are you sure you want to delete the academic session "${activeItem?.year}"? This action cannot be reversed.`}
        confirmText="Delete Session"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Sessions;
