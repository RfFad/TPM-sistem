const db = require('../../config/database');
module.exports = {
    pag : async (req, res) => {
        res.render('dokumen/index', {tittle: 'Dokumen'})
    },
   page: (req, res) => {
    const queryItem = 'SELECT * FROM recruitment WHERE id_rec = ?';
    const queryDaftar = 'SELECT * FROM daftar_istilah';

    db.query(queryItem, [1], (err, itemResult) => {
        if (err) {
            console.log(err);
            return res.send('Terjadi error');
        }

        db.query(queryDaftar, (err, daftarResult) => {
            if (err) {
                console.log(err);
                return res.send('Terjadi error');
            }

            res.render('dokumen/index', {
                title: 'Dokumen',
                item: itemResult[0],
                daftar: daftarResult
            });
        });
    });
},
update : async (req, res) => {
  const { tujuan, referensi, ruang_lingkup } = req.body;

  const sql = `
    UPDATE recruitment
    SET tujuan = ?, referensi = ?, ruang_lingkup = ?
    WHERE id_rec = ?
  `;

  db.query(
    sql,
    [tujuan, referensi, ruang_lingkup, 1],
    (err, result) => {
      if (err) {
        console.error('Update Error:', err);
        return res.json({
          success: false,
          message: 'Gagal update dokumen'
        });
      }

      res.json({
        success: true,
        affectedRows: result.affectedRows
      });
    }
  );
}



}

