const db = require('../../config/database');

 module.exports =  {
 dataTabel : (req, res) => { 
    const canManage = ['admin', 'develop'].includes(req.user.role);
     db.query(`
        SELECT h.*, u.username        FROM history h
        LEFT JOIN user u ON h.id_user = u.id_user
        LEFT JOIN doc d ON h.id_doc = d.id_doc
        ORDER BY h.created_at DESC
    `, (err, history) => {

        if (err) {
            console.error("HISTORY ERROR:", err);
            history = [];
        }

        res.render('riwayat/index', {
            tittle: 'Riwayat Aktivitas',
            message: 'Project TPM Sistem',
            active: 'riwayat',
            user: req.user,
            canManage,
            history
        });

    })
    }}