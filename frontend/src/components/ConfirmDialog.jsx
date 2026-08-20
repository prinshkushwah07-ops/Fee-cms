import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {cancelText}
      </button>
      <button 
        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small" footer={footer}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', textAlign: 'left' }}>
        <div style={{
          backgroundColor: type === 'danger' ? 'var(--danger-light)' : 'var(--primary-light)',
          color: type === 'danger' ? 'var(--danger)' : 'var(--primary)',
          borderRadius: '50%',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
