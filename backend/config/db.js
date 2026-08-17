import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('======================================================');
    console.error('MySQL Database Connection FAILED!');
    console.error('Error Details:', error.message);
    console.error('Please make sure:');
    console.error('1. Your MySQL server is running.');
    console.error('2. The database "fee-management" exists.');
    console.error('3. Credentials inside backend/.env are correct.');
    console.error('======================================================');
  }
};

testConnection();

export default pool;
