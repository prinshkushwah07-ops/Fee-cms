import { api } from './api';

// --- MAPPING UTILITIES ---

const mapStudentToFrontend = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    admissionNo: s.admission_number,
    name: s.student_name,
    fatherName: s.father_name,
    motherName: s.mother_name,
    mobile: s.mobile_number,
    address: s.address,
    class: s.class,
    section: s.section,
    sessionYear: s.session_year,
    admissionDate: s.admission_date,
    monthlyFee: s.monthly_fee
  };
};

const mapStudentToBackend = (s) => {
  if (!s) return null;
  return {
    admission_number: s.admissionNo,
    student_name: s.name,
    father_name: s.fatherName,
    mother_name: s.motherName,
    mobile_number: s.mobile,
    address: s.address,
    class: s.class,
    section: s.section,
    session_year: s.sessionYear,
    admission_date: s.admissionDate,
    monthly_fee: s.monthlyFee
  };
};

const mapSessionToFrontend = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    year: s.session_name,
    active: s.is_active === 1 || s.is_active === true
  };
};

const mapPaymentToFrontend = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    receiptNo: p.receipt_number,
    studentId: p.admission_number || p.student_id,
    studentName: p.student_name,
    sessionYear: p.session_name || p.session_year,
    months: p.fee_month ? p.fee_month.split(',') : [],
    monthlyFee: p.monthly_fee,
    totalFee: p.total_fee,
    paidAmount: p.paid_amount,
    pendingAmount: p.pending_amount,
    paymentMode: p.payment_mode,
    paymentDate: p.payment_date
  };
};

// --- DATA SERVICE INTERFACE ---

export const dataService = {
  
  // 1. Session Methods
  getSessions: async () => {
    const list = await api.get('/sessions');
    return list.map(mapSessionToFrontend);
  },

  getActiveSession: async () => {
    const list = await api.get('/sessions');
    const active = list.find(s => s.is_active === 1);
    return active ? mapSessionToFrontend(active) : null;
  },

  addSession: async (year) => {
    const res = await api.post('/sessions', { session_name: year });
    return mapSessionToFrontend(res);
  },

  updateSession: async (id, year) => {
    const res = await api.put(`/sessions/${id}`, { session_name: year });
    return mapSessionToFrontend(res);
  },

  setActiveSession: async (id) => {
    const res = await api.put(`/sessions/${id}`, { is_active: 1 });
    return mapSessionToFrontend(res);
  },

  deleteSession: async (id) => {
    return api.delete(`/sessions/${id}`);
  },

  // 2. Student Methods
  getStudents: async () => {
    const list = await api.get('/students');
    return list.map(mapStudentToFrontend);
  },

  getStudentByAdmissionNo: async (admissionNo) => {
    const list = await api.get('/students');
    const match = list.find(s => s.admission_number === admissionNo);
    if (!match) return null;
    const detail = await api.get(`/students/${match.id}`);
    return mapStudentToFrontend(detail);
  },

  addStudent: async (studentData) => {
    const payload = mapStudentToBackend(studentData);
    const res = await api.post('/students', payload);
    return mapStudentToFrontend(res);
  },

  updateStudent: async (admissionNo, studentData) => {
    const list = await api.get('/students');
    const match = list.find(s => s.admission_number === admissionNo);
    if (!match) throw new Error('Student profile not found');
    const payload = mapStudentToBackend(studentData);
    const res = await api.put(`/students/${match.id}`, payload);
    return mapStudentToFrontend(res);
  },

  deleteStudent: async (admissionNo) => {
    const list = await api.get('/students');
    const match = list.find(s => s.admission_number === admissionNo);
    if (!match) throw new Error('Student profile not found');
    return api.delete(`/students/${match.id}`);
  },

  // 3. Fee Payments Methods
  getPayments: async () => {
    const list = await api.get('/fees');
    return list.map(mapPaymentToFrontend);
  },

  getPaymentByReceiptNo: async (receiptNo) => {
    const res = await api.get(`/fees/${receiptNo}`);
    return mapPaymentToFrontend(res);
  },

  recordPayment: async (paymentData) => {
    // Lookup database IDs for student and session
    const studentList = await api.get('/students');
    const matchStudent = studentList.find(s => s.admission_number === paymentData.studentId);
    if (!matchStudent) throw new Error(`Student with admission number ${paymentData.studentId} not found.`);

    const sessionList = await api.get('/sessions');
    const matchSession = sessionList.find(s => s.session_name === paymentData.sessionYear);
    if (!matchSession) throw new Error(`Academic session ${paymentData.sessionYear} not found.`);

    const payload = {
      student_id: matchStudent.id,
      session_id: matchSession.id,
      fee_month: paymentData.months.join(','),
      number_of_months: paymentData.months.length,
      monthly_fee: paymentData.monthlyFee,
      paid_amount: paymentData.paidAmount,
      payment_mode: paymentData.paymentMode,
      payment_date: paymentData.paymentDate
    };

    const res = await api.post('/fees', payload);
    return mapPaymentToFrontend(res, matchStudent.student_name, matchStudent.admission_number, matchSession.session_name);
  },

  updatePayment: async (receiptNo, paymentData) => {
    const record = await dataService.getPaymentByReceiptNo(receiptNo);
    if (!record) throw new Error('Payment record not found');
    const payload = {
      paid_amount: paymentData.paidAmount,
      payment_mode: paymentData.paymentMode,
      payment_date: paymentData.paymentDate
    };
    const res = await api.put(`/fees/${record.id}`, payload);
    return mapPaymentToFrontend(res);
  },

  deletePayment: async (receiptNo) => {
    const record = await dataService.getPaymentByReceiptNo(receiptNo);
    if (!record) throw new Error('Payment record not found');
    return api.delete(`/fees/${record.id}`);
  },

  // 4. Reports & Statistics Methods
  getStudentPaidMonths: async (admissionNo, sessionYear) => {
    const studentList = await api.get('/students');
    const matchStudent = studentList.find(s => s.admission_number === admissionNo);
    if (!matchStudent) return {};

    const data = await api.get(`/reports/student/${matchStudent.id}`);
    const payments = data.payments || [];
    const map = {};

    payments.forEach(p => {
      if (p.session_name === sessionYear) {
        const months = p.fee_month ? p.fee_month.split(',') : [];
        const status = p.pending_amount > 0 ? 'Partially Paid' : 'Paid';
        months.forEach(m => {
          map[m] = {
            receiptNo: p.receipt_number,
            status
          };
        });
      }
    });
    return map;
  },

  getStudentWiseReport: async (admissionNo) => {
    const studentList = await api.get('/students');
    const matchStudent = studentList.find(s => s.admission_number === admissionNo);
    if (!matchStudent) throw new Error('Student profile not found');

    const data = await api.get(`/reports/student/${matchStudent.id}`);
    return {
      student: mapStudentToFrontend(data.student),
      payments: data.payments.map(mapPaymentToFrontend)
    };
  },

  getDashboardStats: async (sessionYear) => {
    const sessionList = await api.get('/sessions');
    const matchSession = sessionList.find(s => s.session_name === sessionYear);
    if (!matchSession) return null;

    return api.get(`/reports/dashboard?session_id=${matchSession.id}`);
  },

  getPendingFeesReport: async (sessionYear) => {
    const sessionList = await api.get('/sessions');
    const matchSession = sessionList.find(s => s.session_name === sessionYear);
    if (!matchSession) return [];

    return api.get(`/reports/pending?session_id=${matchSession.id}`);
  },

  getDailyCollectionReport: async (date) => {
    const list = await api.get(`/reports/daily?date=${date}`);
    return list.map(mapPaymentToFrontend);
  },

  getMonthlyCollectionReport: async (month) => {
    const list = await api.get(`/reports/monthly?month=${month}`);
    return list.map(mapPaymentToFrontend);
  },

  getSessionCollectionReport: async (sessionYear) => {
    const list = await api.get('/fees');
    const filtered = list.filter(p => p.session_name === sessionYear);
    return filtered.map(mapPaymentToFrontend);
  },

  getModeCollectionReport: async (mode) => {
    const endpoint = mode.toLowerCase() === 'cash' ? '/reports/cash' : '/reports/upi';
    const list = await api.get(endpoint);
    return list.map(mapPaymentToFrontend);
  }
};
