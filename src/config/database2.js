require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
 host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,      // DATE/DATETIME dikembalikan sebagai string 'YYYY-MM-DD' (bebas masalah timezone)
  decimalNumbers: true,   // DECIMAL / hasil SUM() dikembalikan sebagai number
});

module.exports = pool;
