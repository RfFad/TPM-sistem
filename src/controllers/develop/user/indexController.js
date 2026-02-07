const db = require('../../../config/database');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username dan password wajib diisi'
      });
    }

    // 🔐 HASH PASSWORD
    const hash = await bcrypt.hash(password, 10);

    // 🔒 ROLE DISET OTOMATIS (TANPA INPUT CLIENT)
    const sql = `
      INSERT INTO user (username, password, role)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [username, hash, role], (err) => {
      if (err) {
        return res.status(500).json({
          message: 'Gagal membuat user',
          err
        });
      }

      res.json({
        message: 'User berhasil dibuat',
        username,
        role
      });
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};
