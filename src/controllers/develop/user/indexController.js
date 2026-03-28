const db = require('../../../config/database');
const bcrypt = require('bcryptjs');


// =============================
// GET ALL USER
// =============================
exports.getAll = (req, res) => {
  db.query("SELECT * FROM user", (err, result) => {
    if (err) return res.status(500).json({ message: 'DB Error' });
    res.json(result);
  });
};


// =============================
// GET DETAIL USER
// =============================
exports.getById = (req, res) => {
  const id = req.params.id;

  db.query("SELECT id_user, username, role FROM user WHERE id_user = ?", 
  [id], (err, result) => {

    if (err || result.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(result[0]);
  });
};


// =============================
// CREATE USER
// =============================

exports.createUser =async (req, res) => {

  try {

    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: 'Semua field wajib diisi'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password minimal 6 karakter'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role],
      (err, result) => {

        if (err) {
          console.log(err);
          return res.status(500).json({
            message: 'Gagal menyimpan ke database'
          });
        }

        res.json({
          message: 'Berhasil disimpan'
        });

      }
    );

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error'
    });
  }

};


// =============================
// UPDATE USER
// =============================
exports.updateUser = async (req, res) => {
  const id = req.params.id;
  let { username, password, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ 
      message: 'Username dan role wajib diisi' 
    });
  }

  // Trim password supaya spasi dianggap kosong
  password = password ? password.trim() : '';

  // 🔍 CEK USERNAME DUPLIKAT
  db.query(
    "SELECT id_user FROM user WHERE username = ? AND id_user != ?",
    [username, id],
    async (err, result) => {

      if (result.length > 0) {
        return res.status(400).json({
          message: 'Username sudah digunakan'
        });
      }

      try {

        let sql;
        let values;

        // ✅ Kalau password DIISI
        if (password !== '') {

          if (password.length < 6) {
            return res.status(400).json({
              message: 'Password minimal 6 karakter'
            });
          }

          const hash = await bcrypt.hash(password, 10);

          sql = `
            UPDATE user 
            SET username = ?, password = ?, role = ?
            WHERE id_user = ?
          `;

          values = [username, hash, role, id];

        } 
        // ✅ Kalau password KOSONG → tidak diupdate
        else {

          sql = `
            UPDATE user 
            SET username = ?, role = ?
            WHERE id_user = ?
          `;

          values = [username, role, id];
        }

        db.query(sql, values, (err) => {
          if (err) {
            return res.status(500).json({ 
              message: 'Gagal update user' 
            });
          }

          res.json({ 
            message: 'User berhasil diupdate' 
          });
        });

      } catch (error) {
        res.status(500).json({ message: 'Server error' });
      }

    }
  );
};


// =============================
// DELETE USER
// =============================
exports.deleteUser = (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM user WHERE id_user = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal hapus user' });

    res.json({ message: 'User berhasil dihapus' });
  });
};


exports.page = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('develop/dataUser/index', {
    tittle: "Data User",
    active: "user",
    user: req.user,
    canManage
  });

};