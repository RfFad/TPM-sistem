const db = require('../config/database');

/**
 * READ ALL
 */
exports.getAll = (req, res) => {
  const sql = 'SELECT * FROM daftar_istilah';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

/**
 * READ BY ID
 */
exports.getById = (req, res) => {
  const sql = 'SELECT * FROM daftar_istilah WHERE id_daftar = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0]);
  });
};

/**
 * CREATE
 */


/**
 * CREATE
 */
exports.create = async (req, res) => {
  try {
    const { nama_istilah, deskripsi } = req.body;

    const sql = `
      INSERT INTO daftar_istilah (nama_istilah, deskripsi)
      VALUES (?, ?)
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [nama_istilah, deskripsi], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    res.status(200).json({
      success: true,
      message: 'Data berhasil ditambahkan',
      id: result.insertId
    });

  } catch (error) {
    console.error('ERROR CREATE ISTILAH:', error); // ✅ LOG KE CONSOLE

    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data'
    });
  }
};

/**
 * UPDATE
 */
exports.update = async (req, res) => {
  try {
    const { nama_istilah, deskripsi } = req.body;
    const { id } = req.params;

    const sql = `
      UPDATE daftar_istilah
      SET nama_istilah = ?, deskripsi = ?
      WHERE id_daftar = ?
    `;

    await new Promise((resolve, reject) => {
      db.query(sql, [nama_istilah, deskripsi, id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    res.status(200).json({
      success: true,
      message: 'Data berhasil diupdate'
    });

  } catch (error) {
    console.error('ERROR UPDATE ISTILAH:', error); // ✅ LOG KE CONSOLE

    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data'
    });
  }
};


/**
 * DELETE
 */
exports.delete = (req, res) => {
  try {
    const sql = 'DELETE FROM daftar_istilah WHERE id_daftar = ?';

    db.query(sql, [req.params.id], (err, result) => {
      if (err) {
        console.error('DELETE ERROR:', err);
        return res.status(500).json({
          success: false,
          message: 'Gagal menghapus data'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Data berhasil dihapus'
      });
    });
  } catch (error) {
    console.error('DELETE TRY-CATCH ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};




exports.page = (req, res) => {
    res.render('rekrut/istilah/index', {tittle: "Daftar Istilah"});
}