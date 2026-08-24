import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fee-management',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Mock database state for offline / Vercel demo fallback
let isMockMode = false;
let mockDb = null;

const initializeMockDb = () => {
  mockDb = {
    users: [
      { id: 1, username: 'admin', password: 'admin123' }
    ],
    sessions: [
      { id: 1, session_name: '2025-26', is_active: 0 },
      { id: 2, session_name: '2026-27', is_active: 1 },
      { id: 3, session_name: '2027-28', is_active: 0 }
    ],
    students: [
      {
        id: 1,
        admission_number: 'ADM2026001',
        student_name: 'Rahul Sharma',
        father_name: 'Ramesh Sharma',
        mother_name: 'Sunita Sharma',
        mobile_number: '9876543210',
        address: '123, Sector 15, Vasundhara, Ghaziabad',
        class: 'Class 10',
        section: 'A',
        session_year: '2026-27',
        admission_date: new Date('2026-04-01'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 2,
        admission_number: 'ADM2026002',
        student_name: 'Priya Patel',
        father_name: 'Sanjay Patel',
        mother_name: 'Meena Patel',
        mobile_number: '9812345678',
        address: '45, Navrangpura, Ahmedabad, Gujarat',
        class: 'Class 12',
        section: 'B',
        session_year: '2026-27',
        admission_date: new Date('2026-04-02'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 3,
        admission_number: 'ADM2026003',
        student_name: 'Amit Kumar',
        father_name: 'Rajender Prasad',
        mother_name: 'Kamla Devi',
        mobile_number: '9988776655',
        address: 'H.No 24, Gali No 3, Laxmi Nagar, Delhi',
        class: 'Class 10',
        section: 'A',
        session_year: '2026-27',
        admission_date: new Date('2026-04-03'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 4,
        admission_number: 'ADM2026004',
        student_name: 'Siddharth Singh',
        father_name: 'Mahendra Singh',
        mother_name: 'Radha Singh',
        mobile_number: '8877665544',
        address: 'Flat 402, Royal Residency, Indirapuram',
        class: 'Class 11',
        section: 'C',
        session_year: '2026-27',
        admission_date: new Date('2026-04-05'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 5,
        admission_number: 'ADM2026005',
        student_name: 'Ananya Roy',
        father_name: 'Bikram Roy',
        mother_name: 'Srabanti Roy',
        mobile_number: '9432109876',
        address: '12/A, Ballygunge Circular Road, Kolkata',
        class: 'Class 9',
        section: 'B',
        session_year: '2026-27',
        admission_date: new Date('2026-04-08'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 6,
        admission_number: 'ADM2026006',
        student_name: 'Vikram Rathore',
        father_name: 'Kalyan Singh Rathore',
        mother_name: 'Urmila Rathore',
        mobile_number: '7766554433',
        address: 'Plot 89, Vaishali Nagar, Jaipur, Rajasthan',
        class: 'Class 12',
        section: 'A',
        session_year: '2026-27',
        admission_date: new Date('2026-04-10'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 7,
        admission_number: 'ADM2026007',
        student_name: 'Neha Gupta',
        father_name: 'Alok Gupta',
        mother_name: 'Reena Gupta',
        mobile_number: '9560123456',
        address: '56, Gomti Nagar, Lucknow, Uttar Pradesh',
        class: 'Class 8',
        section: 'A',
        session_year: '2026-27',
        admission_date: new Date('2026-04-12'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 8,
        admission_number: 'ADM2026008',
        student_name: 'Arjun Verma',
        father_name: 'Suresh Verma',
        mother_name: 'Kiran Verma',
        mobile_number: '9911223344',
        address: 'Flat 101, Sky High Apts, HSR Layout, Bangalore',
        class: 'Class 11',
        section: 'B',
        session_year: '2026-27',
        admission_date: new Date('2026-04-15'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 9,
        admission_number: 'ADM2026009',
        student_name: 'Sneha Reddy',
        father_name: 'Venkat Reddy',
        mother_name: 'Lakshmi Reddy',
        mobile_number: '8899001122',
        address: 'Plot 304, Jubilee Hills, Hyderabad',
        class: 'Class 12',
        section: 'C',
        session_year: '2026-27',
        admission_date: new Date('2026-04-18'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      },
      {
        id: 10,
        admission_number: 'ADM2026010',
        student_name: 'Rohan Das',
        father_name: 'Pranab Das',
        mother_name: 'Mithu Das',
        mobile_number: '9007012345',
        address: '34/1, Salt Lake Sector 2, Kolkata',
        class: 'Class 10',
        section: 'B',
        session_year: '2025-26',
        admission_date: new Date('2025-05-10'),
        monthly_fee: 2000,
        created_at: new Date('2026-08-17T12:06:46Z'),
        updated_at: new Date('2026-08-17T12:06:46Z')
      }
    ],
    fee_payments: [
      {
        id: 1,
        receipt_number: 'REC-10001',
        student_id: 1,
        session_id: 2,
        fee_month: 'April,May,June',
        number_of_months: 3,
        monthly_fee: 2000,
        total_fee: 6000,
        paid_amount: 6000,
        pending_amount: 0,
        payment_mode: 'UPI',
        payment_date: new Date('2026-06-05'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        receipt_number: 'REC-10002',
        student_id: 2,
        session_id: 2,
        fee_month: 'April,May',
        number_of_months: 2,
        monthly_fee: 2500,
        total_fee: 5000,
        paid_amount: 5000,
        pending_amount: 0,
        payment_mode: 'UPI',
        payment_date: new Date('2026-05-10'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        receipt_number: 'REC-10003',
        student_id: 3,
        session_id: 2,
        fee_month: 'April,May,June,July',
        number_of_months: 4,
        monthly_fee: 2000,
        total_fee: 8000,
        paid_amount: 7000,
        pending_amount: 1000,
        payment_mode: 'Cash',
        payment_date: new Date('2026-07-12'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        receipt_number: 'REC-10004',
        student_id: 4,
        session_id: 2,
        fee_month: 'April',
        number_of_months: 1,
        monthly_fee: 2200,
        total_fee: 2200,
        paid_amount: 2200,
        pending_amount: 0,
        payment_mode: 'Cash',
        payment_date: new Date('2026-04-10'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        receipt_number: 'REC-10005',
        student_id: 5,
        session_id: 2,
        fee_month: 'April,May,June',
        number_of_months: 3,
        monthly_fee: 1800,
        total_fee: 5400,
        paid_amount: 5400,
        pending_amount: 0,
        payment_mode: 'UPI',
        payment_date: new Date('2026-06-15'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        receipt_number: 'REC-10006',
        student_id: 6,
        session_id: 2,
        fee_month: 'April,May',
        number_of_months: 2,
        monthly_fee: 2500,
        total_fee: 5000,
        paid_amount: 4000,
        pending_amount: 1000,
        payment_mode: 'Cash',
        payment_date: new Date('2026-05-20'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        receipt_number: 'REC-10007',
        student_id: 7,
        session_id: 2,
        fee_month: 'April,May,June,July,August',
        number_of_months: 5,
        monthly_fee: 1500,
        total_fee: 7500,
        paid_amount: 7500,
        pending_amount: 0,
        payment_mode: 'UPI',
        payment_date: new Date('2026-08-17'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 8,
        receipt_number: 'REC-10008',
        student_id: 10,
        session_id: 1,
        fee_month: 'April,May,June,July,August,September,October,November,December,January,February,March',
        number_of_months: 12,
        monthly_fee: 1800,
        total_fee: 21600,
        paid_amount: 21600,
        pending_amount: 0,
        payment_mode: 'UPI',
        payment_date: new Date('2026-03-10'),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]
  };
};

const mockQuery = async (sql, params = []) => {
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  
  // 1. Users login
  if (cleanSql.includes('FROM users WHERE username = ? AND password = ?')) {
    const [username, password] = params;
    const match = mockDb.users.filter(u => u.username === username && u.password === password);
    return [match];
  }
  
  // 2. Get sessions
  if (cleanSql.includes('FROM sessions ORDER BY session_name ASC')) {
    return [[...mockDb.sessions].sort((a, b) => a.session_name.localeCompare(b.session_name))];
  }
  
  // 3. Find session by name duplicate check
  if (cleanSql.includes('FROM sessions WHERE session_name = ? AND id != ?')) {
    const [name, id] = params;
    return [mockDb.sessions.filter(s => s.session_name === name && s.id != id)];
  }

  // 4. Find session by name
  if (cleanSql.includes('FROM sessions WHERE session_name = ?')) {
    const [name] = params;
    return [mockDb.sessions.filter(s => s.session_name === name)];
  }

  // 5. Find session by ID
  if (cleanSql.includes('FROM sessions WHERE id = ?')) {
    const [id] = params;
    return [mockDb.sessions.filter(s => s.id == id)];
  }

  // 6. Insert session
  if (cleanSql.includes('INSERT INTO sessions')) {
    const [name] = params;
    const newSession = { id: mockDb.sessions.length + 1, session_name: name, is_active: 0 };
    mockDb.sessions.push(newSession);
    return [{ insertId: newSession.id }];
  }

  // 7. Deactivate all sessions
  if (cleanSql.includes('UPDATE sessions SET is_active = 0') && !cleanSql.includes('WHERE')) {
    mockDb.sessions.forEach(s => s.is_active = 0);
    return [{}];
  }

  // 8. Activate session
  if (cleanSql.includes('UPDATE sessions SET is_active = 1 WHERE id = ?')) {
    const [id] = params;
    mockDb.sessions.forEach(s => {
      if (s.id == id) s.is_active = 1;
    });
    return [{}];
  }

  // 9. Rename session
  if (cleanSql.includes('UPDATE sessions SET session_name = ? WHERE id = ?')) {
    const [name, id] = params;
    mockDb.sessions.forEach(s => {
      if (s.id == id) s.session_name = name;
    });
    return [{}];
  }

  // 10. Delete session
  if (cleanSql.includes('DELETE FROM sessions WHERE id = ?')) {
    const [id] = params;
    mockDb.sessions = mockDb.sessions.filter(s => s.id != id);
    return [{}];
  }

  // 11. Get all students
  if (cleanSql.includes('SELECT * FROM students') && !cleanSql.includes('WHERE')) {
    return [mockDb.students];
  }

  // 12. Find student by ID
  if (cleanSql.includes('SELECT * FROM students WHERE id = ?')) {
    const [id] = params;
    return [mockDb.students.filter(s => s.id == id)];
  }

  // 13. Find student by lowercase admission number
  if (cleanSql.includes('LOWER(admission_number) = LOWER(?)')) {
    const [adm] = params;
    return [mockDb.students.filter(s => s.admission_number.toLowerCase() === adm.toLowerCase())];
  }

  // 14. Find student by admission number and id difference
  if (cleanSql.includes('admission_number = ? AND id != ?')) {
    const [adm, id] = params;
    return [mockDb.students.filter(s => s.admission_number === adm && s.id != id)];
  }

  // 15. Insert student
  if (cleanSql.includes('INSERT INTO students')) {
    const [adm, name, father, mother, mobile, address, cls, section, session_year, admission_date, monthly_fee] = params;
    const newStudent = {
      id: mockDb.students.reduce((max, s) => Math.max(max, s.id), 0) + 1,
      admission_number: adm,
      student_name: name,
      father_name: father,
      mother_name: mother,
      mobile_number: mobile,
      address,
      class: cls,
      section,
      session_year,
      admission_date: new Date(admission_date),
      monthly_fee: Number(monthly_fee),
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.students.push(newStudent);
    return [{ insertId: newStudent.id }];
  }

  // 16. Update student
  if (cleanSql.includes('UPDATE students SET')) {
    const [adm, name, father, mother, mobile, address, cls, section, session_year, admission_date, monthly_fee, id] = params;
    mockDb.students.forEach(s => {
      if (s.id == id) {
        s.admission_number = adm;
        s.student_name = name;
        s.father_name = father;
        s.mother_name = mother;
        s.mobile_number = mobile;
        s.address = address;
        s.class = cls;
        s.section = section;
        s.session_year = session_year;
        s.admission_date = new Date(admission_date);
        s.monthly_fee = Number(monthly_fee);
        s.updated_at = new Date();
      }
    });
    return [{}];
  }

  // 17. Delete student
  if (cleanSql.includes('DELETE FROM students WHERE id = ?')) {
    const [id] = params;
    mockDb.students = mockDb.students.filter(s => s.id != id);
    mockDb.fee_payments = mockDb.fee_payments.filter(p => p.student_id != id);
    return [{}];
  }

  // 18. Get all payments
  if (cleanSql.includes('FROM fee_payments p') && !cleanSql.includes('WHERE')) {
    const joined = mockDb.fee_payments.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        session_name: session.session_name
      };
    });
    return [joined.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))];
  }

  // 19. Find payment by ID or Receipt Number
  if (cleanSql.includes('p.id = ? OR p.receipt_number = ?')) {
    const [idVal, receiptVal] = params;
    const match = mockDb.fee_payments.filter(p => p.id == idVal || p.receipt_number == receiptVal);
    const joined = match.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        class: student.class,
        section: student.section,
        session_name: session.session_name
      };
    });
    return [joined];
  }

  // 20. Find payment by ID
  if (cleanSql.includes('SELECT * FROM fee_payments WHERE id = ?')) {
    const [id] = params;
    return [mockDb.fee_payments.filter(p => p.id == id)];
  }

  // 21. Get payments by student and session for duplicate checking
  if (cleanSql.includes('fee_month FROM fee_payments WHERE student_id = ? AND session_id = ?')) {
    const [sId, sessId] = params;
    return [mockDb.fee_payments.filter(p => p.student_id == sId && p.session_id == sessId).map(p => ({ fee_month: p.fee_month }))];
  }

  // 22. Insert payment
  if (cleanSql.includes('INSERT INTO fee_payments')) {
    const [receipt, student_id, session_id, fee_month, number_of_months, monthly_fee, total_fee, paid, pending_amount, payment_mode, payment_date] = params;
    const newPayment = {
      id: mockDb.fee_payments.reduce((max, p) => Math.max(max, p.id), 0) + 1,
      receipt_number: receipt,
      student_id: Number(student_id),
      session_id: Number(session_id),
      fee_month,
      number_of_months: Number(number_of_months),
      monthly_fee: Number(monthly_fee),
      total_fee: Number(total_fee),
      paid_amount: Number(paid),
      pending_amount: Number(pending_amount),
      payment_mode,
      payment_date: new Date(payment_date),
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.fee_payments.push(newPayment);
    return [{ insertId: newPayment.id }];
  }

  // 23. Update payment
  if (cleanSql.includes('UPDATE fee_payments')) {
    const [paid, pending_amount, payment_mode, payment_date, id] = params;
    mockDb.fee_payments.forEach(p => {
      if (p.id == id) {
        p.paid_amount = Number(paid);
        p.pending_amount = Number(pending_amount);
        p.payment_mode = payment_mode;
        p.payment_date = new Date(payment_date);
        p.updated_at = new Date();
      }
    });
    return [{}];
  }

  // 24. Delete payment
  if (cleanSql.includes('DELETE FROM fee_payments WHERE id = ?')) {
    const [id] = params;
    mockDb.fee_payments = mockDb.fee_payments.filter(p => p.id != id);
    return [{}];
  }

  // 25. Daily reports
  if (cleanSql.includes('WHERE p.payment_date = ?')) {
    const [date] = params;
    const match = mockDb.fee_payments.filter(p => {
      const pDateStr = new Date(p.payment_date).toISOString().split('T')[0];
      return pDateStr === date;
    });
    const joined = match.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        session_name: session.session_name
      };
    });
    return [joined];
  }

  // 26. Monthly reports
  if (cleanSql.includes('WHERE p.payment_date LIKE ?')) {
    const [likeParam] = params;
    const prefix = likeParam.replace('%', '');
    const match = mockDb.fee_payments.filter(p => {
      const pDateStr = new Date(p.payment_date).toISOString().split('T')[0];
      return pDateStr.startsWith(prefix);
    });
    const joined = match.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        session_name: session.session_name
      };
    });
    return [joined];
  }

  // 27. Payment mode Cash reports
  if (cleanSql.includes("WHERE p.payment_mode = 'Cash'")) {
    const match = mockDb.fee_payments.filter(p => p.payment_mode === 'Cash');
    const joined = match.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        session_name: session.session_name
      };
    });
    return [joined];
  }

  // 28. Payment mode UPI reports
  if (cleanSql.includes("WHERE p.payment_mode = 'UPI'")) {
    const match = mockDb.fee_payments.filter(p => p.payment_mode === 'UPI');
    const joined = match.map(p => {
      const student = mockDb.students.find(s => s.id == p.student_id) || {};
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        student_name: student.student_name,
        admission_number: student.admission_number,
        session_name: session.session_name
      };
    });
    return [joined];
  }

  // 29. Reports by student
  if (cleanSql.includes('WHERE p.student_id = ?')) {
    const [sId] = params;
    const match = mockDb.fee_payments.filter(p => p.student_id == sId);
    const joined = match.map(p => {
      const session = mockDb.sessions.find(s => s.id == p.session_id) || {};
      return {
        ...p,
        session_name: session.session_name
      };
    });
    return [joined.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))];
  }

  // 30. Dashboard sum stats daily
  if (cleanSql.includes('SUM(paid_amount) as total FROM fee_payments WHERE payment_date = ?')) {
    const [date] = params;
    const match = mockDb.fee_payments.filter(p => new Date(p.payment_date).toISOString().split('T')[0] === date);
    const sum = match.reduce((acc, p) => acc + p.paid_amount, 0);
    return [[{ total: sum }]];
  }

  // 31. Dashboard sum stats monthly
  if (cleanSql.includes('SUM(paid_amount) as total FROM fee_payments WHERE payment_date LIKE ?')) {
    const [likeParam] = params;
    const prefix = likeParam.replace('%', '');
    const match = mockDb.fee_payments.filter(p => new Date(p.payment_date).toISOString().split('T')[0].startsWith(prefix));
    const sum = match.reduce((acc, p) => acc + p.paid_amount, 0);
    return [[{ total: sum }]];
  }

  // 32. Get all payments in a session
  if (cleanSql.includes('SELECT * FROM fee_payments WHERE session_id = ?')) {
    const [sessId] = params;
    return [mockDb.fee_payments.filter(p => p.session_id == sessId)];
  }

  // 33. Get all students in a session_year
  if (cleanSql.includes('SELECT * FROM students WHERE session_year = ?')) {
    const [year] = params;
    return [mockDb.students.filter(s => s.session_year === year)];
  }

  console.warn('⚠️ MOCK DB: Unhandled SQL Query:', cleanSql, params);
  return [[]];
};

// Overwrite pool.query to route to mock DB if MySQL is down
const originalQuery = pool.query;
pool.query = async function (sql, params) {
  if (isMockMode) {
    return mockQuery(sql, params);
  }
  return originalQuery.apply(pool, arguments);
};

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected');
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.log('======================================================');
    console.log('>>> SWITCHING TO MOCK DATABASE MODE (Vercel / Offline Demo Compatibility) <<<');
    console.log('======================================================');
    isMockMode = true;
    initializeMockDb();
  }
};

testConnection();

export default pool;
