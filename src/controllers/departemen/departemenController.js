const db = require('../../config/database');

exports.departemen = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/page', {
    tittle: "departemen",
    active: "departemen",
   // dept: "1",
    user: req.user,
    canManage,
  })
}
exports.qc = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/qc', {
    tittle: "departemen QC",
    active: "qc",
    dept: "1",
    user: req.user,
    canManage
  })
}
exports.produksi = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/produksi', {
    tittle: "departemen produksi",
    active: "produksi",
    dept: "2",
    user: req.user,
    canManage
  })
}
exports.mold = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/mold', {
    tittle: "departemen mold",
    active: "mold",
    dept: "4",
    user: req.user,
    canManage
  })
}
exports.mtn = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/mtn', {
    tittle: "departemen mtn",
    dept: "3",
    active: "mtn",
    user: req.user,
    canManage
  })
}
exports.mtn = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/mtn', {
    tittle: "departemen mtn",
    dept: "3",
    active: "mtn",
    user: req.user,
    canManage
  })
}
exports.ppic = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/ppic', {
    tittle: "departemen ppic",
    dept: "5",
    active: "ppic",
    user: req.user,
    canManage
  })
}

exports.getByDepartemen = (req, res) => {

  const namaDept = req.params.id_dept;

  const query = `
    SELECT 
      doc.*, 
      kategori_doc.nama_kategori, 
      departemen.nama_dept,
      departemen.id_dept



    FROM doc

    JOIN kategori_doc 
      ON doc.id_kategori = kategori_doc.id_kategori

    JOIN departemen 
      ON doc.id_dept = departemen.id_dept

    WHERE departemen.id_dept = ?

    ORDER BY doc.id_doc DESC
  `;

  db.query(query, [namaDept], (err, result) => {

    if (err) {
      console.error(err);

      return res.status(500).json({
        success: false
      });
    }

    res.json({
      success: true,
      data: result
    });

  });

};