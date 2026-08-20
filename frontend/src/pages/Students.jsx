import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { dataService } from '../services/dataService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const Students = () => {
  const { showToast } = useToast();
  
  // Data State
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  // Modal / Dialogue States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    admissionNo: '',
    name: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    address: '',
    class: 'Class 10',
    section: 'A',
    sessionYear: '',
    admissionDate: '',
    monthlyFee: 2000
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const studentList = await dataService.getStudents();
      const sessionList = await dataService.getSessions();
      setStudents(studentList);
      setSessions(sessionList);
    } catch (err) {
      showToast('Error', 'Failed to retrieve records from the SQL database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get active session default
  const defaultSession = useMemo(() => {
    const active = sessions.find(s => s.active);
    return active ? active.year : (sessions[0]?.year || '');
  }, [sessions]);

  // List unique classes in database for filter
  const classesList = useMemo(() => {
    const classes = students.map(s => s.class);
    return [...new Set(classes)].sort();
  }, [students]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchClass = selectedClass ? student.class === selectedClass : true;
      const matchSession = selectedSession ? student.sessionYear === selectedSession : true;
      return matchClass && matchSession;
    });
  }, [students, selectedClass, selectedSession]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyFee' ? Number(value) : value
    }));
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form inputs
  const validateForm = (isEdit = false) => {
    const errors = {};
    if (!formData.admissionNo.trim()) {
      errors.admissionNo = 'Admission Number is required';
    } else if (!isEdit && students.some(s => s.admissionNo.toLowerCase() === formData.admissionNo.toLowerCase())) {
      errors.admissionNo = 'Admission Number already exists';
    }

    if (!formData.name.trim()) errors.name = 'Student Name is required';
    if (!formData.fatherName.trim()) errors.fatherName = "Father's Name is required";
    if (!formData.motherName.trim()) errors.motherName = "Mother's Name is required";
    
    // Mobile Validation (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile Number is required';
    } else if (!mobileRegex.test(formData.mobile.trim())) {
      errors.mobile = 'Invalid Mobile Number (must be 10 digits starting with 6-9)';
    }

    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.class) errors.class = 'Class is required';
    if (!formData.section) errors.section = 'Section is required';
    if (!formData.sessionYear) errors.sessionYear = 'Session Year is required';
    if (!formData.admissionDate) errors.admissionDate = 'Admission Date is required';
    
    if (!formData.monthlyFee) {
      errors.monthlyFee = 'Monthly fee amount is required';
    } else if (Number(formData.monthlyFee) <= 0) {
      errors.monthlyFee = 'Monthly fee must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setFormData({
      admissionNo: `ADM${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      fatherName: '',
      motherName: '',
      mobile: '',
      address: '',
      class: 'Class 10',
      section: 'A',
      sessionYear: defaultSession,
      admissionDate: new Date().toISOString().split('T')[0],
      monthlyFee: 2000
    });
    setFormErrors({});
    setIsAddOpen(true);
  };

  // Submit Add Student
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    try {
      await dataService.addStudent(formData);
      await loadData();
      setIsAddOpen(false);
      showToast('Student Registered', `${formData.name} was successfully registered.`, 'success');
    } catch (err) {
      showToast('Registration Error', err.message, 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setActiveStudent(student);
    setFormData({ 
      ...student,
      // Format date correctly to YYYY-MM-DD for date input
      admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : ''
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    try {
      await dataService.updateStudent(activeStudent.admissionNo, formData);
      await loadData();
      setIsEditOpen(false);
      showToast('Student Details Updated', `${formData.name}'s profile was updated successfully.`, 'success');
    } catch (err) {
      showToast('Update Error', err.message, 'error');
    }
  };

  // Open Delete Confirm Dialogue
  const handleOpenDelete = (student) => {
    setActiveStudent(student);
    setIsDeleteOpen(true);
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    try {
      await dataService.deleteStudent(activeStudent.admissionNo);
      await loadData();
      showToast('Student Removed', `${activeStudent.name}'s profile and transaction history were deleted.`, 'success');
    } catch (err) {
      showToast('Deletion Error', err.message, 'error');
    }
  };

  // Table Columns Definition
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
    { header: "Father's Name", key: 'fatherName', sortable: true },
    { header: 'Mobile Number', key: 'mobile' },
    {
      header: 'Class',
      key: 'class',
      sortable: true,
      render: (row) => `${row.class} - ${row.section}`
    },
    {
      header: 'Session',
      key: 'sessionYear',
      sortable: true,
      render: (row) => (
        <span className="badge badge-info">{row.sessionYear}</span>
      )
    },
    {
      header: 'Monthly Fee',
      key: 'monthlyFee',
      sortable: true,
      render: (row) => `₹${row.monthlyFee.toLocaleString('en-IN')}`
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
          <Link to={`/students/${row.admissionNo}`} className="btn btn-secondary btn-icon" title="View Profile" style={{ padding: '0.375rem' }}>
            <Eye size={14} />
          </Link>
          <button className="btn btn-secondary btn-icon" title="Edit Student" style={{ padding: '0.375rem' }} onClick={() => handleOpenEdit(row)}>
            <Edit size={14} />
          </button>
          <button className="btn btn-secondary btn-icon" title="Delete Student" style={{ padding: '0.375rem', color: 'var(--danger)' }} onClick={() => handleOpenDelete(row)}>
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Title */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Student Directory</h1>
          <p className="page-subtitle">Manage student enrollment records and profile settings in SQL database</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={16} />
          Add New Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-item">
          <label htmlFor="filterClass">Class:</label>
          <select 
            id="filterClass"
            className="form-control form-select" 
            style={{ width: '130px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filterSession">Session:</label>
          <select 
            id="filterSession"
            className="form-control form-select" 
            style={{ width: '140px', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <option value="">All Sessions</option>
            {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
          </select>
        </div>

        {(selectedClass || selectedSession) && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => { setSelectedClass(''); setSelectedSession(''); }}
          >
            Clear Filters
          </button>
        )}
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading student records...</span>
          </div>
        </div>
      ) : (
        /* Data Table */
        <DataTable
          columns={columns}
          data={filteredStudents}
          searchPlaceholder="Search by name or admission number..."
          searchKeys={['name', 'admissionNo']}
          emptyStateTitle="No Students Found"
          emptyStateDesc="Try adjusting your search criteria or register a new student."
        />
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Student"
        size="large"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddSubmit}>Register Student</button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Admission Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="admissionNo"
              className="form-control"
              value={formData.admissionNo}
              onChange={handleChange}
            />
            {formErrors.admissionNo && <span className="form-feedback-error">{formErrors.admissionNo}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Student Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="E.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
            />
            {formErrors.name && <span className="form-feedback-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Father's Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="fatherName"
              className="form-control"
              value={formData.fatherName}
              onChange={handleChange}
            />
            {formErrors.fatherName && <span className="form-feedback-error">{formErrors.fatherName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mother's Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="motherName"
              className="form-control"
              value={formData.motherName}
              onChange={handleChange}
            />
            {formErrors.motherName && <span className="form-feedback-error">{formErrors.motherName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="tel"
              name="mobile"
              maxLength="10"
              className="form-control"
              placeholder="10-digit mobile number"
              value={formData.mobile}
              onChange={handleChange}
            />
            {formErrors.mobile && <span className="form-feedback-error">{formErrors.mobile}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Fee (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="number"
              name="monthlyFee"
              className="form-control"
              value={formData.monthlyFee}
              onChange={handleChange}
            />
            {formErrors.monthlyFee && <span className="form-feedback-error">{formErrors.monthlyFee}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Residential Address <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              name="address"
              className="form-control"
              rows="2"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
            {formErrors.address && <span className="form-feedback-error">{formErrors.address}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Class <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="class" className="form-control form-select" value={formData.class} onChange={handleChange}>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
            {formErrors.class && <span className="form-feedback-error">{formErrors.class}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Section <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="section" className="form-control form-select" value={formData.section} onChange={handleChange}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            {formErrors.section && <span className="form-feedback-error">{formErrors.section}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Academic Session Year <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="sessionYear" className="form-control form-select" value={formData.sessionYear} onChange={handleChange}>
              {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
            </select>
            {formErrors.sessionYear && <span className="form-feedback-error">{formErrors.sessionYear}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Admission Date <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="date"
              name="admissionDate"
              className="form-control"
              value={formData.admissionDate}
              onChange={handleChange}
            />
            {formErrors.admissionDate && <span className="form-feedback-error">{formErrors.admissionDate}</span>}
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Student Profile: ${activeStudent?.name}`}
        size="large"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Admission Number</label>
            <input
              type="text"
              name="admissionNo"
              className="form-control"
              value={formData.admissionNo}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
            />
            {formErrors.name && <span className="form-feedback-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Father's Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="fatherName"
              className="form-control"
              value={formData.fatherName}
              onChange={handleChange}
            />
            {formErrors.fatherName && <span className="form-feedback-error">{formErrors.fatherName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mother's Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="motherName"
              className="form-control"
              value={formData.motherName}
              onChange={handleChange}
            />
            {formErrors.motherName && <span className="form-feedback-error">{formErrors.motherName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="tel"
              name="mobile"
              maxLength="10"
              className="form-control"
              value={formData.mobile}
              onChange={handleChange}
            />
            {formErrors.mobile && <span className="form-feedback-error">{formErrors.mobile}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Fee (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="number"
              name="monthlyFee"
              className="form-control"
              value={formData.monthlyFee}
              onChange={handleChange}
            />
            {formErrors.monthlyFee && <span className="form-feedback-error">{formErrors.monthlyFee}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Residential Address <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              name="address"
              className="form-control"
              rows="2"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
            {formErrors.address && <span className="form-feedback-error">{formErrors.address}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Class <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="class" className="form-control form-select" value={formData.class} onChange={handleChange}>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
            {formErrors.class && <span className="form-feedback-error">{formErrors.class}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Section <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="section" className="form-control form-select" value={formData.section} onChange={handleChange}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            {formErrors.section && <span className="form-feedback-error">{formErrors.section}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Academic Session Year <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="sessionYear" className="form-control form-select" value={formData.sessionYear} onChange={handleChange}>
              {sessions.map(s => <option key={s.id} value={s.year}>{s.year}</option>)}
            </select>
            {formErrors.sessionYear && <span className="form-feedback-error">{formErrors.sessionYear}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Admission Date <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="date"
              name="admissionDate"
              className="form-control"
              value={formData.admissionDate}
              onChange={handleChange}
            />
            {formErrors.admissionDate && <span className="form-feedback-error">{formErrors.admissionDate}</span>}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialogue */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Profile"
        message={`Are you sure you want to delete the student profile for "${activeStudent?.name}" (${activeStudent?.admissionNo})? This will also purge their complete fee receipt history.`}
        confirmText="Delete Profile"
        cancelText="Keep Profile"
        type="danger"
      />
    </div>
  );
};

export default Students;
