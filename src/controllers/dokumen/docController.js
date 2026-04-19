const db = require('../../config/database');
const path = require('path');
const multer = require('multer');


// ===============================
// MULTER CONFIG
// ===============================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // gunakan nama asli file
  }
});

const upload = multer({ storage: storage }).single('file');

exports.uploadFile = upload;


// ===============================
// CREATE
// ===============================

exports.create = (req, res) => {

  const data = {
    no_doc: req.body.no_doc,
    nama_doc: req.body.nama_doc,
    departemen: req.body.departemen,
    tgl_new: req.body.tgl_new,
    status: 'NEW',
    file: req.file ? req.file.filename : null,
    id_user: req.body.id_user
  };

  db.query("INSERT INTO doc SET ?", data, (err, result) => {
    if (err) {
      console.error("INSERT ERROR:", err);
      return res.status(500).json(err);
    }

    // =========================
    // TAMBAHAN HISTORY
    // =========================
    const historyData = {
      id_doc: result.insertId,
      aksi: 'CREATE',
      deskripsi: 'Membuat dokumen baru',
       nama_doc: req.body.nama_doc,
      id_user: req.body.id_user
    };

    db.query("INSERT INTO history SET ?", historyData, (errHistory) => {
      if (errHistory) {
        console.error("HISTORY ERROR:", errHistory);
      }
    });
    // =========================

    res.json({
      success: true,
      message: "Data berhasil ditambahkan"
    });
  });
};


// ===============================
// READ ALL
// ===============================

exports.getAll = (req, res) => {

  db.query('SELECT * FROM doc ORDER BY id_doc DESC', (err, result) => {
    if (err) {
      console.error("GET ALL ERROR:", err);
      return res.status(500).json({ success: false });
    }

    res.json(result);
  });

};


// ===============================
// READ BY ID
// ===============================

exports.getById = (req, res) => {

  const id = req.params.id;

  db.query(
    "SELECT * FROM doc WHERE id_doc = ?",
    [id],
    (err, rows) => {

      if (err) {
        console.error("GET BY ID ERROR:", err);
        return res.status(500).json(err);
      }

      res.json(rows[0]);
    }
  );
};


// ===============================
// UPDATE
// ===============================

exports.update = (req, res) => {

  const id = req.params.id;

  const data = {
    no_doc: req.body.no_doc,
    nama_doc: req.body.nama_doc,
    departemen: req.body.departemen,
    tgl_new: req.body.tgl_new,
    status: 'REVISI',
    file: req.file ? req.file.filename : req.body.old_file,
  };

  //  Update dokumen dulu
  db.query(
    "UPDATE doc SET ? WHERE id_doc = ?",
    [data, id],
    (err, result) => {

      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({
          success: false,
          message: "Gagal update"
        });
      }

      if (result.affectedRows === 0) {
        return res.json({
          success: false,
          message: "ID tidak ditemukan"
        });
      }

      // Ambil nomor revisi terakhir
      db.query(
        "SELECT MAX(no_rev) AS last_rev FROM revisi WHERE id_doc = ?",
        [id],
        (err2, rows) => {

          if (err2) {
            console.error("REV QUERY ERROR:", err2);
            return res.status(500).json({
              success: false,
              message: "Gagal ambil revisi"
            });
          }

          const lastRev = rows[0].last_rev || 0;
          const newRev = lastRev + 1;

          // Insert ke tabel revisi
          const revisiData = {
            id_doc: id,
            tgl: new Date(),
            no_rev: newRev,
            keterangan: req.body.keterangan || 'Revisi dokumen',
            id_user: req.body.id_user
          };

          db.query(
            "INSERT INTO revisi SET ?",
            revisiData,
            (err3) => {

              if (err3) {
                console.error("INSERT REVISI ERROR:", err3);
                return res.status(500).json({
                  success: false,
                  message: "Gagal simpan revisi"
                });
              }

              // TAMBAHAN HISTORY
             
              const historyData = {
                id_doc: id,
                aksi: 'UPDATE',
                deskripsi: `Update dokumen & tambah revisi ke-${newRev}`,
                nama_doc: req.body.nama_doc,
                id_user: req.body.id_user
              };

              db.query(
                "INSERT INTO history SET ?",
                historyData,
                (errHistory) => {
                  if (errHistory) {
                    console.error("HISTORY ERROR:", errHistory);
                  }
                }
              );
              // =========================

              res.json({
                success: true,
                message: "Berhasil update & simpan revisi"
              });

            }
          );

        }
      );

    }
  );
};

// ===============================
// DELETE
// ===============================

exports.delete = (req, res) => {

  const id = req.params.id;

 db.query("SELECT nama_doc FROM doc WHERE id_doc = ?", [id], (err, rows) => {

  if (err || rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Data tidak ditemukan"
    });
  }

  const namaDoc = rows[0].nama_doc;

  db.query("DELETE FROM doc WHERE id_doc = ?", [id], (err2, result) => {

    if (err2) {
      return res.status(500).json({
        success: false,
        message: "Gagal menghapus data"
      });
    }

    // Simpan history dengan nama dokumen
    const historyData = {
      id_doc: id,
      nama_doc: namaDoc,
      aksi: 'DELETE',
      deskripsi: 'Menghapus dokumen',
      id_user: req.user.id_user
    };

    db.query("INSERT INTO history SET ?", historyData);

    res.json({
      success: true,
      message: "Data berhasil dihapus"
    });

  });

});
};

exports.detail = (req, res) => {

  const id = req.params.id;

  const query = `
    SELECT d.*, u.username AS uploaded_by FROM doc d LEFT JOIN user u ON d.id_user = u.id_user WHERE d.id_doc = ?;
  `;

  db.query(query, [id], (err, dokumen) => {

    if (err) return res.status(500).json(err);

    db.query(`
      SELECT r.*, u.username
      FROM revisi r
      LEFT JOIN user u ON r.id_user = u.id_user
      WHERE r.id_doc = ?
      ORDER BY r.tgl DESC
    `, [id], (err2, revisi) => {

      if (err2) return res.status(500).json(err2);

      res.json({
        dokumen: dokumen[0],
        revisi: revisi
      });

    });

  });

};

// ===============================
// PAGE RENDER
// ===============================

exports.page = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('dokumen/page', {
    tittle: "Data Dokumen",
    active: "dokumen",
    user: req.user,
    canManage
  });

};