const db = require('../config/database');

module.exports =  {
   homePage: (req, res) => {

    const canManage = ['admin', 'develop'].includes(req.user.role);

    // 1️⃣ Ambil history terakhir
    db.query(`
        SELECT h.*, u.username
        FROM history h
        LEFT JOIN user u ON h.id_user = u.id_user
        LEFT JOIN doc d ON h.id_doc = d.id_doc
        ORDER BY h.created_at DESC
        LIMIT 5
    `, (err, history) => {

        if (err) {
            console.error("HISTORY ERROR:", err);
            history = [];
        }

        // 2️⃣ Total seluruh dokumen
        db.query(`
            SELECT COUNT(*) AS total_doc 
            FROM doc
        `, (err2, totalResult) => {

            let totalDoc = 0;

            if (err2) {
                console.error("TOTAL DOC ERROR:", err2);
            } else {
                totalDoc = totalResult[0].total_doc;
            }

            // 3️⃣ Total dokumen bulan berjalan
            db.query(`
                SELECT COUNT(*) AS total_bulan
                FROM doc
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                AND YEAR(created_at) = YEAR(CURRENT_DATE())
            `, (err3, bulanResult) => {

                let totalBulanIni = 0;

                if (err3) {
                    console.error("DOC BULAN ERROR:", err3);
                } else {
                    totalBulanIni = bulanResult[0].total_bulan;
                }

                // Render ke halaman
                res.render('index', {
                    tittle: 'Home Page',
                    message: 'Project TPM Sistem',
                    active: 'dashboard',
                    user: req.user,
                    canManage,
                    history,
                    totalDoc,
                    totalBulanIni
                });

            });

        });

    });

},
    dataTabel :  async (req, res) => { 
        res.render('data/index', { tittle: 'Data Tabel', message: 'Project TPM Sistem'})
    }
}