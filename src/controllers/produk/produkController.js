const db = require('../../config/database');

// Render halaman
exports.page = (req, res) => {

    const canManage = ['admin', 'develop'].includes(req.user.role);

    res.render('produk/index', {
        tittle: 'Produk',
        active: 'produk',
        canManage,
        user: req.user
    });

};

// Tampilkan data
exports.show = (req, res) => {

    const sql = `
        SELECT
            id_produk,
            nama_produk,
            no_part,
            material,
            costumer
        FROM produk
        ORDER BY id_produk DESC
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data'
            });
        }

        res.json({
            success: true,
            data: rows
        });

    });

};

// Simpan
exports.save = (req, res) => {

    const {
        nama_produk,
        no_part,
        material,
        costumer
    } = req.body;

    db.query(
        `INSERT INTO produk
        (
            nama_produk,
            no_part,
            material,
            costumer
        )
        VALUES (?, ?, ?, ?)`,
        [
            nama_produk,
            no_part,
            material,
            costumer
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Gagal menyimpan data'
                });
            }

            res.json({
                success: true,
                message: 'Data berhasil disimpan'
            });

        }
    );

};

// Detail
exports.get = (req, res) => {

    db.query(
        'SELECT * FROM produk WHERE id_produk = ?',
        [req.params.id],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true,
                data: rows[0]
            });

        }
    );

};

// Update
exports.update = (req, res) => {

    const {
        id_produk,
        nama_produk,
        no_part,
        material,
        costumer
    } = req.body;

    db.query(
        `UPDATE produk SET
            nama_produk = ?,
            no_part = ?,
            material = ?,
            costumer = ?
        WHERE id_produk = ?`,
        [
            nama_produk,
            no_part,
            material,
            costumer,
            id_produk
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Gagal update data'
                });
            }

            res.json({
                success: true,
                message: 'Data berhasil diupdate'
            });

        }
    );

};

// Hapus
exports.delete = (req, res) => {

    db.query(
        'DELETE FROM produk WHERE id_produk = ?',
        [req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Gagal menghapus data'
                });
            }

            res.json({
                success: true,
                message: 'Data berhasil dihapus'
            });

        }
    );

};