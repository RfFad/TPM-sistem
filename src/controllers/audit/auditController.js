const db = require('../../config/database');


// ======================================================
// HALAMAN UTAMA AUDIT
// ======================================================

exports.index = (req, res) => {

    const sql = `
        SELECT
            id_customer,
            nama_customer,
            plant,
            status
        FROM customer
        WHERE status = 'AKTIF'
        ORDER BY nama_customer ASC
    `;

    db.query(sql, (err, customers) => {

        if (err) {

            console.error(err);

            return res.status(500).send('Database error');

        }

        const canManage =
            ['admin', 'develop'].includes(req.user.role);

        res.render('audit/index', {

            title: 'Audit',
            tittle: 'Audit',

            active: 'audit',

            customers: customers,

            canManage: canManage,

            user: req.user

        });

    });

};


// ======================================================
// AUDIT BERDASARKAN CUSTOMER
// ======================================================

exports.getAuditByCustomer = (req, res) => {

    const { id_customer } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,
            a.nama_audit,
            a.tgl_audit,
            a.pic,
            a.status,

            c.nama_customer,
            c.plant

        FROM audit a

        LEFT JOIN customer c
            ON a.id_customer = c.id_customer

        WHERE a.id_customer = ?

        ORDER BY a.tgl_audit DESC
    `;

    db.query(
        sql,
        [id_customer],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data audit'
                });

            }

            res.json({
                success: true,
                data: result
            });

        }
    );

};


// ======================================================
// TAHUN AUDIT
// ======================================================

exports.getYears = (req, res) => {

    const { id_customer } = req.params;

    const sql = `
        SELECT DISTINCT
            YEAR(tgl_audit) AS tahun

        FROM audit

        WHERE id_customer = ?

        ORDER BY tahun DESC
    `;

    db.query(
        sql,
        [id_customer],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil tahun audit'
                });

            }

            res.json({
                success: true,
                data: result
            });

        }
    );

};


// ======================================================
// AUDIT CUSTOMER + TAHUN
// ======================================================

exports.getAuditByYear = (req, res) => {

    const {
        id_customer,
        tahun
    } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,
            a.nama_audit,
            a.tgl_audit,
            a.pic,
            a.status,

            c.nama_customer,
            c.plant

        FROM audit a

        LEFT JOIN customer c
            ON a.id_customer = c.id_customer

        WHERE a.id_customer = ?

        AND YEAR(a.tgl_audit) = ?

        ORDER BY a.tgl_audit DESC
    `;

    db.query(
        sql,
        [id_customer, tahun],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data audit'
                });

            }

            res.json({
                success: true,
                data: result
            });

        }
    );

};


// ======================================================
// DETAIL AUDIT
// ======================================================

exports.detail = (req, res) => {

    const { id_audit } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,
            a.nama_audit,
            a.tgl_audit,
            a.pic,
            a.status,

            c.nama_customer,
            c.plant

        FROM audit a

        LEFT JOIN customer c
            ON a.id_customer = c.id_customer

        WHERE a.id_audit = ?

        LIMIT 1
    `;

    db.query(
        sql,
        [id_audit],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil detail audit'
                });

            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Data audit tidak ditemukan'
                });

            }

            res.json({
                success: true,
                data: result[0]
            });

        }
    );

};


// ======================================================
// CREATE AUDIT
// ======================================================

exports.create = (req, res) => {

    const {
        id_customer,
        nama_audit,
        tgl_audit,
        pic,
        status
    } = req.body;


    if (
        !id_customer ||
        !nama_audit ||
        !tgl_audit ||
        !pic ||
        !status
    ) {

        return res.status(400).json({
            success: false,
            message: 'Data audit belum lengkap'
        });

    }


    const sql = `
        INSERT INTO audit
        (
            id_customer,
            nama_audit,
            tgl_audit,
            pic,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            id_customer,
            nama_audit,
            tgl_audit,
            pic,
            status
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal menambahkan audit'
                });

            }


            res.json({
                success: true,
                message: 'Audit berhasil ditambahkan',
                id_audit: result.insertId
            });

        }
    );

};


// ======================================================
// UPDATE AUDIT
// ======================================================

exports.update = (req, res) => {

    const { id_audit } = req.params;

    const {
        id_customer,
        nama_audit,
        tgl_audit,
        pic,
        status
    } = req.body;


    if (
        !id_customer ||
        !nama_audit ||
        !tgl_audit ||
        !pic ||
        !status
    ) {

        return res.status(400).json({
            success: false,
            message: 'Data audit belum lengkap'
        });

    }


    const sql = `
        UPDATE audit

        SET
            id_customer = ?,
            nama_audit = ?,
            tgl_audit = ?,
            pic = ?,
            status = ?

        WHERE id_audit = ?
    `;


    db.query(
        sql,
        [
            id_customer,
            nama_audit,
            tgl_audit,
            pic,
            status,
            id_audit
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengubah audit'
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Data audit tidak ditemukan'
                });

            }


            res.json({
                success: true,
                message: 'Audit berhasil diperbarui'
            });

        }
    );

};


// ======================================================
// DELETE AUDIT
// ======================================================

exports.delete = (req, res) => {

    const { id_audit } = req.params;


    const sql = `
        DELETE FROM audit
        WHERE id_audit = ?
    `;


    db.query(
        sql,
        [id_audit],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal menghapus audit'
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Data audit tidak ditemukan'
                });

            }


            res.json({
                success: true,
                message: 'Audit berhasil dihapus'
            });

        }
    );

};