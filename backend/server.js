import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

dotenv.config();

const app = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

if (process.env.ALLOWED_ORIGINS) {
  const origins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...origins);
} else if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      const cleanAllowed = allowedOrigin.replace(/\/$/, '');
      const cleanOrigin = origin.replace(/\/$/, '');
      return cleanAllowed === cleanOrigin;
    }) || /\.vercel\.app$/i.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} - Origin: ${req.get('origin') || 'No Origin'}`);
  next();
});

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Nexvora Fee Management System MySQL API.' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fee Management API is running'
  });
});

// --- REST API ENDPOINTS ---

// 1. Authentication Router
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[AUTH] Login route reached for username: "${username}"`);
  
  if (!username || !password) {
    console.log('[AUTH] Login failed: Missing credentials');
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    console.log('[AUTH] Querying database for user matching username...');
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    console.log('[AUTH] Database query executed successfully');
    
    if (rows.length > 0) {
      console.log(`[AUTH] Authentication successful for username: "${username}"`);
      res.json({
        success: true,
        user: {
          id: rows[0].id,
          username: rows[0].username,
          name: 'System Administrator',
          role: 'Admin'
        }
      });
    } else {
      console.log(`[AUTH] Authentication failed: Invalid username or password for "${username}"`);
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('[AUTH] Database connection or query error during login:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// 2. Session Management Routes
// GET /api/sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions ORDER BY session_name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sessions
app.post('/api/sessions', async (req, res) => {
  const { session_name } = req.body;
  if (!session_name) {
    return res.status(400).json({ message: 'Session name is required' });
  }

  try {
    // Check duplicate
    const [exists] = await pool.query('SELECT * FROM sessions WHERE session_name = ?', [session_name]);
    if (exists.length > 0) {
      return res.status(400).json({ message: `Session ${session_name} already exists.` });
    }

    const [result] = await pool.query('INSERT INTO sessions (session_name, is_active) VALUES (?, 0)', [session_name]);
    res.status(201).json({ id: result.insertId, session_name, is_active: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/sessions/:id (Rename or Set Active)
app.put('/api/sessions/:id', async (req, res) => {
  const { session_name, is_active } = req.body;
  const { id } = req.params;

  try {
    // If setting active, deactivate all first
    if (is_active === 1 || is_active === true) {
      await pool.query('UPDATE sessions SET is_active = 0');
      await pool.query('UPDATE sessions SET is_active = 1 WHERE id = ?', [id]);
    } else if (session_name) {
      // Validate duplicate
      const [exists] = await pool.query('SELECT * FROM sessions WHERE session_name = ? AND id != ?', [session_name, id]);
      if (exists.length > 0) {
        return res.status(400).json({ message: `Session ${session_name} already exists.` });
      }
      await pool.query('UPDATE sessions SET session_name = ? WHERE id = ?', [session_name, id]);
    }

    const [updated] = await pool.query('SELECT * FROM sessions WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/sessions/:id
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [session] = await pool.query('SELECT * FROM sessions WHERE id = ?', [id]);
    if (session.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session[0].is_active === 1) {
      return res.status(400).json({ message: 'Cannot delete the active session. Set another session active first.' });
    }

    await pool.query('DELETE FROM sessions WHERE id = ?', [id]);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Student RoutesPrinsh@2004

// GET /api/students
app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id
app.get('/api/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students
app.post('/api/students', async (req, res) => {
  const { 
    admission_number, student_name, father_name, mother_name, mobile_number, 
    address, class: cls, section, session_year, admission_date, monthly_fee 
  } = req.body;

  try {
    // Validate duplicate admission number
    const [exists] = await pool.query('SELECT * FROM students WHERE LOWER(admission_number) = LOWER(?)', [admission_number]);
    if (exists.length > 0) {
      return res.status(400).json({ message: `Admission Number ${admission_number} already exists.` });
    }

    const [result] = await pool.query(`
      INSERT INTO students (admission_number, student_name, father_name, mother_name, mobile_number, address, class, section, session_year, admission_date, monthly_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [admission_number, student_name, father_name, mother_name, mobile_number, address, cls, section, session_year, admission_date, monthly_fee]);

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/:id
app.put('/api/students/:id', async (req, res) => {
  const { 
    admission_number, student_name, father_name, mother_name, mobile_number, 
    address, class: cls, section, session_year, admission_date, monthly_fee 
  } = req.body;
  const { id } = req.params;

  try {
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    // Validate duplicate admission number
    const [exists] = await pool.query('SELECT * FROM students WHERE admission_number = ? AND id != ?', [admission_number, id]);
    if (exists.length > 0) {
      return res.status(400).json({ message: `Admission Number ${admission_number} already exists.` });
    }

    await pool.query(`
      UPDATE students 
      SET admission_number = ?, student_name = ?, father_name = ?, mother_name = ?, mobile_number = ?, address = ?, class = ?, section = ?, session_year = ?, admission_date = ?, monthly_fee = ?
      WHERE id = ?
    `, [admission_number, student_name, father_name, mother_name, mobile_number, address, cls, section, session_year, admission_date, monthly_fee, id]);

    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/students/:id
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student and related payment receipts deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Fees / Payments Routes
// GET /api/fees
app.get('/api/fees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/fees/:id
app.get('/api/fees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Support querying by ID or by Receipt Number
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, s.class, s.section, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      WHERE p.id = ? OR p.receipt_number = ?
    `, [id, id]);
    
    if (rows.length === 0) return res.status(404).json({ message: 'Payment record not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/fees
app.post('/api/fees', async (req, res) => {
  const { 
    student_id, session_id, fee_month, number_of_months, monthly_fee, paid_amount, payment_mode, payment_date 
  } = req.body;

  try {
    // 1. Validate student
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [student_id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    // 2. Validate session
    const [session] = await pool.query('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (session.length === 0) return res.status(404).json({ message: 'Session year not found' });

    // 3. Backend calculations
    const total_fee = monthly_fee * number_of_months;
    const paid = Number(paid_amount);

    if (paid > total_fee) {
      return res.status(400).json({ message: `Paid amount (₹${paid}) cannot exceed total fee (₹${total_fee})` });
    }

    const pending_amount = total_fee - paid;
    const receipt_number = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    // 4. Check duplicate payments:
    // Split input fee_month string (e.g. "April,May") to check for duplicates
    const inputMonths = fee_month.split(',');
    const [existing] = await pool.query('SELECT fee_month FROM fee_payments WHERE student_id = ? AND session_id = ?', [student_id, session_id]);
    
    const paidMonths = existing.flatMap(p => p.fee_month.split(','));
    const duplicates = inputMonths.filter(m => paidMonths.includes(m));

    if (duplicates.length > 0) {
      return res.status(400).json({ message: `Months (${duplicates.join(', ')}) already paid for this student.` });
    }

    // 5. Insert payment
    const [result] = await pool.query(`
      INSERT INTO fee_payments (receipt_number, student_id, session_id, fee_month, number_of_months, monthly_fee, total_fee, paid_amount, pending_amount, payment_mode, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [receipt_number, student_id, session_id, fee_month, number_of_months, monthly_fee, total_fee, paid, pending_amount, payment_mode, payment_date]);

    res.status(201).json({
      id: result.insertId,
      receipt_number,
      student_id,
      session_id,
      fee_month,
      number_of_months,
      monthly_fee,
      total_fee,
      paid_amount: paid,
      pending_amount,
      payment_mode,
      payment_date
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/fees/:id
app.put('/api/fees/:id', async (req, res) => {
  const { paid_amount, payment_mode, payment_date } = req.body;
  const { id } = req.params;

  try {
    const [payment] = await pool.query('SELECT * FROM fee_payments WHERE id = ?', [id]);
    if (payment.length === 0) return res.status(404).json({ message: 'Transaction record not found' });

    const total_fee = payment[0].total_fee;
    const paid = Number(paid_amount);

    if (paid > total_fee) {
      return res.status(400).json({ message: `Paid amount (₹${paid}) cannot exceed total fee (₹${total_fee})` });
    }

    const pending_amount = total_fee - paid;

    await pool.query(`
      UPDATE fee_payments 
      SET paid_amount = ?, pending_amount = ?, payment_mode = ?, payment_date = ?
      WHERE id = ?
    `, [paid, pending_amount, payment_mode, payment_date, id]);

    res.json({
      ...payment[0],
      paid_amount: paid,
      pending_amount,
      payment_mode,
      payment_date
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/fees/:id
app.delete('/api/fees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [payment] = await pool.query('SELECT * FROM fee_payments WHERE id = ?', [id]);
    if (payment.length === 0) return res.status(404).json({ message: 'Transaction record not found' });

    await pool.query('DELETE FROM fee_payments WHERE id = ?', [id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- REPORTS API ROUTERS ---

// GET /api/reports/daily?date=YYYY-MM-DD
app.get('/api/reports/daily', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      WHERE p.payment_date = ?
      ORDER BY p.payment_date DESC
    `, [date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/monthly?month=YYYY-MM
app.get('/api/reports/monthly', async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7); // "YYYY-MM"
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      WHERE p.payment_date LIKE ?
      ORDER BY p.payment_date DESC
    `, [`${month}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/cash
app.get('/api/reports/cash', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      WHERE p.payment_mode = 'Cash'
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/upi
app.get('/api/reports/upi', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.student_name, s.admission_number, se.session_name 
      FROM fee_payments p 
      JOIN students s ON p.student_id = s.id 
      JOIN sessions se ON p.session_id = se.id 
      WHERE p.payment_mode = 'UPI'
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/pending?session_id=id
app.get('/api/reports/pending', async (req, res) => {
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    // 1. Get all students registered in this session year
    const [session] = await pool.query('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (session.length === 0) return res.status(404).json({ message: 'Session not found' });
    
    const [sessionStudents] = await pool.query('SELECT * FROM students WHERE session_year = ?', [session[0].session_name]);
    
    // 2. Get all payments recorded in this session
    const [sessionPayments] = await pool.query('SELECT * FROM fee_payments WHERE session_id = ?', [session_id]);

    const ACADEMIC_MONTHS = [
      'April', 'May', 'June', 'July', 'August', 'September', 
      'October', 'November', 'December', 'January', 'February', 'March'
    ];

    const today = new Date();
    let monthIndex = today.getMonth();
    let academicIndex = 0;
    if (monthIndex >= 3) {
      academicIndex = monthIndex - 3;
    } else {
      academicIndex = monthIndex + 9;
    }
    academicIndex = Math.min(11, academicIndex);
    const dueMonths = ACADEMIC_MONTHS.slice(0, academicIndex + 1);

    const report = [];

    sessionStudents.forEach(student => {
      const studentPayments = sessionPayments.filter(p => p.student_id === student.id);
      
      // Calculate paid months list
      const paidMonths = studentPayments.flatMap(p => p.fee_month.split(','));
      
      const pendingMonths = [];
      dueMonths.forEach(m => {
        // If not paid, or partially paid:
        // For simplicity, if month name is not in paidMonths, it is unpaid
        const match = studentPayments.find(p => p.fee_month.split(',').includes(m));
        if (!match) {
          pendingMonths.push(m);
        } else if (match.pending_amount > 0) {
          pendingMonths.push(`${m} (Partial)`);
        }
      });

      // Calculate total outstanding amount
      let paidForDueMonths = 0;
      studentPayments.forEach(p => {
        const intersection = p.fee_month.split(',').filter(m => dueMonths.includes(m));
        if (intersection.length > 0) {
          // Proportionate paid amount
          paidForDueMonths += p.paid_amount * (intersection.length / p.fee_month.split(',').length);
        }
      });

      const expectedDue = dueMonths.length * student.monthly_fee;
      const outstanding = Math.max(0, expectedDue - paidForDueMonths);

      if (outstanding > 0) {
        report.push({
          id: student.id,
          admissionNo: student.admission_number,
          name: student.student_name,
          class: `${student.class}-${student.section}`,
          sessionYear: student.session_year,
          pendingMonths,
          pendingAmount: outstanding
        });
      }
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/student/:student_id
app.get('/api/reports/student/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [student_id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    const [payments] = await pool.query(`
      SELECT p.*, se.session_name 
      FROM fee_payments p 
      JOIN sessions se ON p.session_id = se.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `, [student_id]);

    res.json({
      student: student[0],
      payments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Dashboard Aggregated Statistics Router
// GET /api/reports/dashboard?session_id=id
app.get('/api/reports/dashboard', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    const [session] = await pool.query('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (session.length === 0) return res.status(404).json({ message: 'Session not found' });
    
    // Total Students registered in session
    const [students] = await pool.query('SELECT * FROM students WHERE session_year = ?', [session[0].session_name]);
    const totalStudents = students.length;

    // Total fees collected in this session
    const [payments] = await pool.query('SELECT * FROM fee_payments WHERE session_id = ?', [session_id]);
    const totalCollected = payments.reduce((acc, p) => acc + p.paid_amount, 0);

    // Today's collection (all sessions)
    const todayStr = new Date().toISOString().split('T')[0];
    const [todayCollectionRows] = await pool.query('SELECT SUM(paid_amount) as total FROM fee_payments WHERE payment_date = ?', [todayStr]);
    const todayCollection = todayCollectionRows[0].total || 0;

    // Month's collection (all sessions)
    const monthStr = todayStr.substring(0, 7); // "YYYY-MM"
    const [monthCollectionRows] = await pool.query('SELECT SUM(paid_amount) as total FROM fee_payments WHERE payment_date LIKE ?', [`${monthStr}%`]);
    const currentMonthCollection = monthCollectionRows[0].total || 0;

    // Outstanding Pending Dues
    const ACADEMIC_MONTHS = [
      'April', 'May', 'June', 'July', 'August', 'September', 
      'October', 'November', 'December', 'January', 'February', 'March'
    ];

    const today = new Date();
    let monthIndex = today.getMonth();
    let academicIndex = 0;
    if (monthIndex >= 3) {
      academicIndex = monthIndex - 3;
    } else {
      academicIndex = monthIndex + 9;
    }
    academicIndex = Math.min(11, academicIndex);
    const dueMonths = ACADEMIC_MONTHS.slice(0, academicIndex + 1);

    let totalPending = 0;
    let paidStudentsCount = 0;
    let pendingStudentsCount = 0;

    students.forEach(student => {
      const studentPayments = payments.filter(p => p.student_id === student.id);
      let paidForDueMonths = 0;
      
      studentPayments.forEach(p => {
        const intersection = p.fee_month.split(',').filter(m => dueMonths.includes(m));
        if (intersection.length > 0) {
          paidForDueMonths += p.paid_amount * (intersection.length / p.fee_month.split(',').length);
        }
      });

      const expectedDue = dueMonths.length * student.monthly_fee;
      const outstanding = Math.max(0, expectedDue - paidForDueMonths);
      
      if (outstanding > 0) {
        totalPending += outstanding;
        pendingStudentsCount++;
      } else {
        paidStudentsCount++;
      }
    });

    res.json({
      totalStudents,
      totalCollected,
      totalPending,
      todayCollection,
      currentMonthCollection,
      paidStudentsCount,
      pendingStudentsCount
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Start listening if not running on Vercel Serverless Functions
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
} else {
  console.log(`Running in serverless environment (Vercel detected)`);
}

export default app;

