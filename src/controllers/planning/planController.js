const db = require('../../config/database');

// Render halaman
exports.page = (req, res) => {

    const sqlHariIni = `
        SELECT COUNT(*) AS total_plan
        FROM planning
        WHERE DATE(tgl) = CURDATE()
    `;

    const sqlTotalBulan = `
        SELECT COUNT(*) AS total_bulan
        FROM (
            SELECT
                YEAR(tgl),
                MONTH(tgl)
            FROM planning
            GROUP BY YEAR(tgl), MONTH(tgl)
        ) x
    `;

    db.query(sqlHariIni, (err, resultHariIni) => {

        if (err) {
            console.error(err);
            return res.redirect('/');
        }

        db.query(sqlTotalBulan, (err2, resultBulan) => {

            if (err2) {
                console.error(err2);
                return res.redirect('/');
            }

            const canManage = ['admin', 'develop'].includes(req.user.role);

            res.render('planning/index', {
                tittle: 'Planning',
                active: 'planning',
                canManage,
                user: req.user,
                totalPlanHariIni: resultHariIni[0].total_plan,
                totalBulanPlanning: resultBulan[0].total_bulan
            });

        });

    });

};


// Tampilkan data
exports.show = (req, res) => {

    const {
        tanggal,
        bulan,
        tahun,
        produk,
        mesin
    } = req.query;

    let sql = `
        SELECT
            p.*,
            pr.nama_produk,
            pr.no_part
        FROM planning p
        LEFT JOIN produk pr
            ON p.id_produk = pr.id_produk
        WHERE 1 = 1
    `;

    let params = [];

    // Filter Tanggal
    if (tanggal) {
        sql += ` AND DATE(p.tgl) = ? `;
        params.push(tanggal);
    }

    // Filter Bulan
    if (bulan) {
        sql += ` AND MONTH(p.tgl) = ? `;
        params.push(bulan);
    }

    // Filter Tahun
    if (tahun) {
        sql += ` AND YEAR(p.tgl) = ? `;
        params.push(tahun);
    }

    // Filter Produk
    if (produk) {
        sql += ` AND p.id_produk = ? `;
        params.push(produk);
    }

    // Filter Mesin
    if (mesin) {
        sql += ` AND p.no_mc LIKE ? `;
        params.push(`%${mesin}%`);
    }

    sql += ` ORDER BY p.tgl DESC, p.id_plan DESC `;

    db.query(sql, params, (err, rows) => {

        if (err) {

            console.log(err);

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
        id_produk,
        tgl,
        no_mc,
        tonage,
        cycle_time,
        cavity,
        keterangan,
        target_day,
        target_hour,
        target_shift
    } = req.body;

    db.query(
        `INSERT INTO planning
        (
            id_produk,
            tgl,
            no_mc,
            tonage,
            cycle_time,
            cavity,
            keterangan,
            target_day,
            target_hour,
            target_shift
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id_produk,
            tgl,
            no_mc,
            tonage,
            cycle_time,
            cavity,
            keterangan,
            target_day,
            target_hour,
            target_shift
        ],
        (err) => {

            if (err) {
                console.error(err);

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

    const id = req.params.id;

    db.query(
        `SELECT 
    p.*,
    pr.nama_produk,
    pr.no_part,
    pr.material,
    pr.costumer
FROM planning p
LEFT JOIN produk pr
    ON p.id_produk = pr.id_produk
WHERE p.id_plan = ?`,
        [id],
        (err, rows) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data'
                });

            }

            res.json(rows[0]);

        }
    );

};

// Update
exports.update = (req, res) => {

    const {
        id_plan,
        id_produk,
        tgl,
        no_mc,
        tonage,
        cycle_time,
        cavity,
        keterangan,
        target_day,
        target_hour,
        target_shift
    } = req.body;

    db.query(
        `UPDATE planning SET
            id_produk = ?,
            tgl = ?,
            no_mc = ?,
            tonage = ?,
            cycle_time = ?,
            cavity = ?,
            keterangan = ?,
            target_day = ?,
            target_hour = ?,
            target_shift = ?
        WHERE id_plan = ?`,
        [
            id_produk,
            tgl,
            no_mc,
            tonage,
            cycle_time,
            cavity,
            keterangan,
            target_day,
            target_hour,
            target_shift,
            id_plan
        ],
        (err) => {

            if (err) {

                console.error(err);

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
        'DELETE FROM planning WHERE id_plan = ?',
        [req.params.id],
        (err) => {

            if (err) {

                console.error(err);

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

exports.planHariIni = (req, res) => {
    db.query(` SELECT
    p.*,
    pr.nama_produk,
    pr.no_part
FROM planning p
LEFT JOIN produk pr
    ON p.id_produk = pr.id_produk
WHERE p.tgl >= CURDATE()
AND p.tgl < CURDATE() + INTERVAL 1 DAY;
    `,  (err, rows) => {
        if (err) {
            return res.status(500).json({
                success : false,
                message : 'Gagal mengambil data'
             })
        }
        res.json({
            success : true,
            data : rows
    });
    })
}


exports.planDay = (req, res) => {

    const canManage = ['admin', 'develop'].includes(req.user.role);


    const sql = `
        SELECT
            p.*,
            pr.nama_produk,
            pr.no_part,
            pr.material,
            pr.costumer

        FROM planning p

        LEFT JOIN produk pr
            ON p.id_produk = pr.id_produk

        WHERE p.tgl = CURDATE()

        ORDER BY p.no_mc ASC
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            console.log('ERROR QUERY');
            console.log(err);
            return res.send(err);
        }

       

        let total = {
            target_hour: 0,
            target_day: 0,
            target_shift: 0
        };

        rows.forEach(item => {

            total.target_hour += Number(item.target_hour || 0);
            total.target_day += Number(item.target_day || 0);
            total.target_shift += Number(item.target_shift || 0);

        });

        res.render('planning/planday', {
            data: rows,
            total,
            tittle: 'Planning',
            active: 'planning',
            canManage,
            user: req.user
        });

    });
};

exports.archiveDetail  =  (req, res) => {

    const canManage = ['admin', 'develop'].includes(req.user.role);

    const { tgl } = req.params;

    

    const sql = `
        SELECT
            p.*,
            pr.nama_produk,
            pr.no_part,
            pr.material,
            pr.costumer
        FROM planning p
        LEFT JOIN produk pr
            ON p.id_produk = pr.id_produk
        WHERE DATE(p.tgl) = ?
        ORDER BY p.no_mc ASC;
    `;

    db.query(sql, [tgl], (err, rows) => {

        if (err) {
            console.log('ERROR QUERY');
            console.log(err);
            return res.send(err);
        }

       

        let total = {
            target_hour: 0,
            target_day: 0,
            target_shift: 0
        };

        rows.forEach(item => {

            total.target_hour += Number(item.target_hour || 0);
            total.target_day += Number(item.target_day || 0);
            total.target_shift += Number(item.target_shift || 0);

        });

        res.render('planning/plantgl', {
            data: rows,
            total,
            tgl,
            tittle: 'Planning',
            active: 'planning',
            canManage,
            user: req.user
        });

    });
};


exports.archive = (req, res) => {
     const canManage = ['admin', 'develop'].includes(req.user.role);

    const sql = `
        SELECT
            YEAR(tgl) tahun,
            MONTH(tgl) bulan,
            COUNT(DISTINCT tgl) total_hari
        FROM planning
        GROUP BY YEAR(tgl), MONTH(tgl)
        ORDER BY tahun DESC, bulan DESC
    `;

    db.query(sql, (err, rows) => {

        res.render('planning/archive-bulan', {
            data: rows,
             tittle: 'Planning',
            active: 'planning',
            canManage,
            user: req.user,
        });

    });

};
exports.archiveBulan = (req, res) => {
     const canManage = ['admin', 'develop'].includes(req.user.role);

    const sql = `
       SELECT
    YEAR(tgl) AS tahun,
    MONTH(tgl) AS bulan,
    MONTHNAME(MIN(tgl)) AS nama_bulan,
    COUNT(DISTINCT tgl) AS total_hari,
    COUNT(*) AS total_plan
FROM planning
GROUP BY
    YEAR(tgl),
    MONTH(tgl)
ORDER BY tahun DESC, bulan DESC;
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            return res.send(err);
        }

        res.render('planning/archive-bulan', {
            data: rows,
            tittle: 'Planning',
            active: 'planning',
            canManage,
            user: req.user,
        });

    });

};
exports.archiveTanggal = (req, res) => {
     const canManage = ['admin', 'develop'].includes(req.user.role);

    const { tahun, bulan } = req.params;

    const sql = `
        SELECT
            tgl,
            COUNT(*) AS total_plan
        FROM planning
        WHERE YEAR(tgl) = ?
        AND MONTH(tgl) = ?
        GROUP BY tgl
        ORDER BY tgl DESC
    `;

    db.query(sql, [tahun, bulan], (err, rows) => {

        if (err) {
            return res.send(err);
        }

        res.render('planning/archive-tanggal', {
            data: rows,
            tittle: 'Planning',
            active: 'planning',
            canManage,
            user: req.user,
        });

    });

};
