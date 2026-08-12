const db = require('../../config/database');

/*
|--------------------------------------------------------------------------
| HALAMAN UTAMA AUDIT
|--------------------------------------------------------------------------
*/

exports.index = (req, res) => {

    const sql = `
        SELECT
            id_customer,
            nama_customer,
            plant,
            status
        FROM customer
        WHERE status = 1
        ORDER BY nama_customer ASC
    `;

    db.query(sql, (err, customers) => {

        if (err) {
            console.error('Error get customer:', err);

            return res.status(500).send(
                'Gagal mengambil data customer'
            );
        }

        const canManage = ['admin', 'develop'].includes(req.user.role);

        res.render('audit/index', {
            tittle: 'Audit',
            active: 'audit',
            user: req.user,
            customers: customers,
            canManage: canManage
        });

    });

};


/*
|--------------------------------------------------------------------------
| GET AUDIT BERDASARKAN CUSTOMER
|--------------------------------------------------------------------------
*/

exports.getAuditByCustomer = (req, res) => {

    const { id_customer } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,
            c.nama_customer,
            c.plant,

            a.nama_audit,
            a.tgl_audit,
            DATE_FORMAT(
                a.tgl_audit,
                '%d %M %Y'
            ) AS tanggal_format,

            YEAR(a.tgl_audit) AS tahun,

            a.pic,
            a.status

        FROM audit a

        LEFT JOIN customer c
            ON c.id_customer = a.id_customer

        WHERE a.id_customer = ?

        ORDER BY a.tgl_audit DESC
    `;

    db.query(
        sql,
        [id_customer],
        (err, result) => {

            if (err) {

                console.error(
                    'Error get audit:',
                    err
                );

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


/*
|--------------------------------------------------------------------------
| GET TAHUN AUDIT
|--------------------------------------------------------------------------
*/

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

                console.error(
                    'Error get audit years:',
                    err
                );

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


/*
|--------------------------------------------------------------------------
| GET AUDIT BERDASARKAN CUSTOMER + TAHUN
|--------------------------------------------------------------------------
*/

exports.getAuditByYear = (req, res) => {

    const {
        id_customer,
        tahun
    } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,

            c.nama_customer,
            c.plant,

            a.nama_audit,
            a.tgl_audit,

            DATE_FORMAT(
                a.tgl_audit,
                '%d %M %Y'
            ) AS tanggal_format,

            a.pic,
            a.status

        FROM audit a

        LEFT JOIN customer c
            ON c.id_customer = a.id_customer

        WHERE
            a.id_customer = ?
            AND YEAR(a.tgl_audit) = ?

        ORDER BY a.tgl_audit DESC
    `;

    db.query(
        sql,
        [
            id_customer,
            tahun
        ],
        (err, result) => {

            if (err) {

                console.error(
                    'Error get audit by year:',
                    err
                );

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


/*
|--------------------------------------------------------------------------
| DETAIL AUDIT
|--------------------------------------------------------------------------
*/

exports.detail = (req, res) => {

    const { id_audit } = req.params;

    const sql = `
        SELECT
            a.id_audit,
            a.id_customer,

            c.nama_customer,
            c.plant,

            a.nama_audit,
            a.tgl_audit,

            DATE_FORMAT(
                a.tgl_audit,
                '%d %M %Y'
            ) AS tanggal_format,

            a.pic,
            a.status

        FROM audit a

        LEFT JOIN customer c
            ON c.id_customer = a.id_customer

        WHERE a.id_audit = ?

        LIMIT 1
    `;

    db.query(
        sql,
        [id_audit],
        (err, result) => {

            if (err) {

                console.error(
                    'Error get audit detail:',
                    err
                );

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


/*
|--------------------------------------------------------------------------
| CREATE AUDIT
|--------------------------------------------------------------------------
*/

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
        !tgl_audit
    ) {

        return res.status(400).json({
            success: false,
            message: 'Customer, nama audit dan tanggal audit wajib diisi'
        });

    }


    const sql = `
        INSERT INTO audit (
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
            pic || null,
            status || 'Planning'
        ],
        (err, result) => {

            if (err) {

                console.error(
                    'Error create audit:',
                    err
                );

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


/*
|--------------------------------------------------------------------------
| UPDATE AUDIT
|--------------------------------------------------------------------------
*/

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
        !tgl_audit
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
            pic || null,
            status || 'Planning',
            id_audit
        ],
        (err) => {

            if (err) {

                console.error(
                    'Error update audit:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengubah audit'
                });

            }


            res.json({
                success: true,
                message: 'Audit berhasil diperbarui'
            });

        }
    );

};


/*
|--------------------------------------------------------------------------
| DELETE AUDIT
|--------------------------------------------------------------------------
*/

exports.delete = (req, res) => {

    const { id_audit } = req.params;

    const sql = `
        DELETE FROM audit
        WHERE id_audit = ?
    `;


    db.query(
        sql,
        [id_audit],
        (err) => {

            if (err) {

                console.error(
                    'Error delete audit:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: 'Gagal menghapus audit'
                });

            }


            res.json({
                success: true,
                message: 'Audit berhasil dihapus'
            });

        }
    );

};