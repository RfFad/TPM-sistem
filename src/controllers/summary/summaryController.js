const db = require('../../config/database');

exports.page = (req, res) => {

    const tgl = req.params.tgl;

    const canManage =
        ['ppic', 'develop'].includes(req.user.role);


    const sql = `
        SELECT
            p.*,

            pr.nama_produk,
            pr.no_part,
            pr.material,
            pr.costumer

        FROM planning p

        LEFT JOIN produk pr
            ON pr.id_produk = p.id_produk

        WHERE p.tgl = ?
    `;


    db.query(
        sql,
        [tgl],
        (err, rows) => {

            if (err) {

                console.error(
                    'SUMMARY PAGE ERROR:',
                    err
                );

                return res.status(500)
                    .send(
                        'Gagal mengambil planning'
                    );

            }


            if (rows.length === 0) {

                return res.status(404)
                    .send(
                        'Planning tidak ditemukan'
                    );

            }


            res.render(
                'summary/index',
                {

                    tittle:
                        'Summary Planning',

                    active:
                        'summaryPlanning',

                    canManage,

                    user:
                        req.user,

                    planning:
                        rows[0]

                }
            );

        }
    );

};
// =====================================================
// GET SUMMARY BERDASARKAN ID PLAN
// =====================================================

exports.getByPlan = (req, res) => {

    const id_plan = req.params.id;

    console.log('GET SUMMARY ID PLAN:', id_plan);


    const sql = `
        SELECT
            p.id_plan,
            p.target_shift,
            p.target_hour,

            sp.id_summary,
            sp.shift,
            sp.target_qty,
            sp.actual_qty,
            sp.downtime_minute,
            sp.minus_qty,
            sp.achievement,
            sp.status,
            sp.kendala,
            sp.keterangan

        FROM planning p

        LEFT JOIN summary_planning sp
            ON p.id_plan = sp.id_plan

        WHERE p.id_plan = ?

        ORDER BY sp.shift ASC
    `;


    db.query(
        sql,
        [id_plan],
        (err, rows) => {

            if (err) {

                console.error(
                    'GET SUMMARY ERROR:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data summary',
                    error: err.message
                });

            }


            if (rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Planning tidak ditemukan'
                });

            }


            const planning = rows[0];


            const summary = rows
                .filter(row => row.id_summary !== null)
                .map(row => {

                    return {

                        id_summary:
                            row.id_summary,

                        id_plan:
                            row.id_plan,

                        shift:
                            row.shift,

                        target_qty:
                            Number(row.target_qty) || 0,

                        actual_qty:
                            Number(row.actual_qty) || 0,

                        downtime_minute:
                            Number(row.downtime_minute) || 0,

                        minus_qty:
                            Number(row.minus_qty) || 0,

                        achievement:
                            Number(row.achievement) || 0,

                        status:
                            row.status || 'Pending',

                        kendala:
                            row.kendala || '',

                        keterangan:
                            row.keterangan || ''

                    };

                });


            res.json({

                success: true,

                planning: {

                    id_plan:
                        planning.id_plan,

                    target_shift:
                        Number(
                            planning.target_shift
                        ) || 0,

                    target_hour:
                        Number(
                            planning.target_hour
                        ) || 0

                },

                data: summary

            });

        }
    );

};



// =====================================================
// SAVE SUMMARY
// =====================================================

exports.save = (req, res) => {

    const {
        id_plan,
        shift,
        actual_qty,
        downtime_minute,
        status,
        kendala,
        keterangan
    } = req.body;


    // ================================================
    // VALIDASI
    // ================================================

    if (!id_plan) {

        return res.status(400).json({
            success: false,
            message: 'ID planning tidak ditemukan'
        });

    }


    if (!shift) {

        return res.status(400).json({
            success: false,
            message: 'Shift tidak ditemukan'
        });

    }


    // ================================================
    // AMBIL DATA PLANNING
    // ================================================

    const sqlPlanning = `
        SELECT
            id_plan,
            target_shift,
            target_hour
        FROM planning
        WHERE id_plan = ?
    `;


    db.query(
        sqlPlanning,
        [id_plan],
        (err, planningRows) => {

            if (err) {

                console.error(
                    'GET PLANNING ERROR:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        'Gagal mengambil data planning'
                });

            }


            if (planningRows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        'Planning tidak ditemukan'
                });

            }


            const planning =
                planningRows[0];


            // =========================================
            // TARGET
            // =========================================

            const target_qty =
                Number(
                    planning.target_shift
                ) || 0;


            const target_hour =
                Number(
                    planning.target_hour
                ) || 0;


            // =========================================
            // ACTUAL
            // =========================================

            const actual =
                Number(actual_qty) || 0;


            // =========================================
            // DOWNTIME
            // =========================================

            const downtime =
                Number(downtime_minute) || 0;


            // =========================================
            // TARGET LOSS
            // =========================================

            const target_loss =
                target_hour *
                (downtime / 60);


            // =========================================
            // TARGET EFEKTIF
            // =========================================

            const effective_target =
                Math.max(
                    target_qty - target_loss,
                    0
                );


            // =========================================
            // MINUS
            // =========================================

            const minus_qty =
                Math.max(
                    effective_target - actual,
                    0
                );


            // =========================================
            // ACHIEVEMENT
            // =========================================

            let achievement = 0;


            if (effective_target > 0) {

                achievement =
                    (
                        actual /
                        effective_target
                    ) * 100;

            }


            achievement =
                Number(
                    achievement.toFixed(2)
                );


            // =========================================
            // CEK SUMMARY
            // =========================================

            const checkSql = `
                SELECT
                    id_summary
                FROM summary_planning
                WHERE id_plan = ?
                AND shift = ?
            `;


            db.query(
                checkSql,
                [
                    id_plan,
                    shift
                ],
                (err, existingRows) => {

                    if (err) {

                        console.error(
                            'CHECK SUMMARY ERROR:',
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                'Gagal mengecek summary'
                        });

                    }


                    // =================================
                    // SUDAH ADA
                    // =================================

                    if (existingRows.length > 0) {

                        return res.status(400).json({
                            success: false,
                            message:
                                'Summary untuk shift tersebut sudah ada'
                        });

                    }


                    // =================================
                    // INSERT
                    // =================================

                    const insertSql = `
                        INSERT INTO summary_planning
                        (
                            id_plan,
                            shift,
                            target_qty,
                            actual_qty,
                            downtime_minute,
                            minus_qty,
                            achievement,
                            status,
                            kendala,
                            keterangan
                        )

                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;


                    db.query(
                        insertSql,
                        [
                            id_plan,
                            shift,
                            target_qty,
                            actual,
                            downtime,
                            minus_qty,
                            achievement,
                            status || 'Pending',
                            kendala || null,
                            keterangan || null
                        ],
                        (err, result) => {

                            if (err) {

                                console.error(
                                    'SAVE SUMMARY ERROR:',
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        'Gagal menyimpan summary',
                                    error: err.message
                                });

                            }


                            res.json({

                                success: true,

                                message:
                                    'Summary berhasil disimpan',

                                id_summary:
                                    result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

};



// =====================================================
// UPDATE SUMMARY
// =====================================================

exports.update = (req, res) => {

    const {
        id_summary,
        actual_qty,
        downtime_minute,
        status,
        kendala,
        keterangan
    } = req.body;


    // ================================================
    // VALIDASI
    // ================================================

    if (!id_summary) {

        return res.status(400).json({
            success: false,
            message:
                'ID summary tidak ditemukan'
        });

    }


    // ================================================
    // AMBIL DATA SUMMARY
    // ================================================

    const sqlSummary = `
        SELECT
            id_summary,
            id_plan,
            shift
        FROM summary_planning
        WHERE id_summary = ?
    `;


    db.query(
        sqlSummary,
        [id_summary],
        (err, summaryRows) => {

            if (err) {

                console.error(
                    'GET SUMMARY ERROR:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        'Gagal mengambil data summary'
                });

            }


            if (summaryRows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        'Summary tidak ditemukan'
                });

            }


            const summary =
                summaryRows[0];


            // =========================================
            // AMBIL PLANNING
            // =========================================

            const sqlPlanning = `
                SELECT
                    target_shift,
                    target_hour
                FROM planning
                WHERE id_plan = ?
            `;


            db.query(
                sqlPlanning,
                [summary.id_plan],
                (err, planningRows) => {

                    if (err) {

                        console.error(
                            'GET PLANNING UPDATE ERROR:',
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                'Gagal mengambil planning'
                        });

                    }


                    if (
                        planningRows.length === 0
                    ) {

                        return res.status(404).json({
                            success: false,
                            message:
                                'Planning tidak ditemukan'
                        });

                    }


                    const planning =
                        planningRows[0];


                    // =================================
                    // TARGET
                    // =================================

                    const target_qty =
                        Number(
                            planning.target_shift
                        ) || 0;


                    const target_hour =
                        Number(
                            planning.target_hour
                        ) || 0;


                    // =================================
                    // ACTUAL
                    // =================================

                    const actual =
                        Number(actual_qty) || 0;


                    // =================================
                    // DOWNTIME
                    // =================================

                    const downtime =
                        Number(downtime_minute) || 0;


                    // =================================
                    // TARGET LOSS
                    // =================================

                    const target_loss =
                        target_hour *
                        (downtime / 60);


                    // =================================
                    // TARGET EFEKTIF
                    // =================================

                    const effective_target =
                        Math.max(
                            target_qty -
                            target_loss,
                            0
                        );


                    // =================================
                    // MINUS
                    // =================================

                    const minus_qty =
                        Math.max(
                            effective_target -
                            actual,
                            0
                        );


                    // =================================
                    // ACHIEVEMENT
                    // =================================

                    let achievement = 0;


                    if (
                        effective_target > 0
                    ) {

                        achievement =
                            (
                                actual /
                                effective_target
                            ) * 100;

                    }


                    achievement =
                        Number(
                            achievement.toFixed(2)
                        );


                    // =================================
                    // UPDATE
                    // =================================

                    const updateSql = `
                        UPDATE summary_planning

                        SET
                            target_qty = ?,
                            actual_qty = ?,
                            downtime_minute = ?,
                            minus_qty = ?,
                            achievement = ?,
                            status = ?,
                            kendala = ?,
                            keterangan = ?

                        WHERE id_summary = ?
                    `;


                    db.query(
                        updateSql,
                        [
                            target_qty,
                            actual,
                            downtime,
                            minus_qty,
                            achievement,
                            status || 'Pending',
                            kendala || null,
                            keterangan || null,
                            id_summary
                        ],
                        (err) => {

                            if (err) {

                                console.error(
                                    'UPDATE SUMMARY ERROR:',
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        'Gagal mengupdate summary',
                                    error: err.message
                                });

                            }


                            res.json({

                                success: true,

                                message:
                                    'Summary berhasil diupdate'

                            });

                        }
                    );

                }
            );

        }
    );

};



// =====================================================
// DELETE SUMMARY
// =====================================================

exports.delete = (req, res) => {

    const id_summary =
        req.params.id;


    db.query(
        `
        DELETE FROM summary_planning
        WHERE id_summary = ?
        `,
        [id_summary],
        (err) => {

            if (err) {

                console.error(
                    'DELETE SUMMARY ERROR:',
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        'Gagal menghapus summary'
                });

            }


            res.json({
                success: true,
                message:
                    'Summary berhasil dihapus'
            });

        }
    );

};
exports.getAllSummary = (req, res) => {

    const tgl = req.params.tgl


    const sql = `

        SELECT

            s.id_summary,
            s.id_plan,
            s.shift,

            s.actual_qty,
            s.downtime_minute,

            s.status,
            s.kendala,
            s.keterangan,

            p.no_mc,
            p.target_hour,
            p.target_day,
            p.target_shift,
            p.tgl,

            pr.nama_produk,
            pr.no_part,
            pr.material,
            pr.costumer

        FROM summary_planning s

        INNER JOIN planning p
            ON p.id_plan = s.id_plan

        LEFT JOIN produk pr
            ON pr.id_produk = p.id_produk

        WHERE p.tgl = ?

        ORDER BY
            p.no_mc ASC,
            s.shift ASC

    `;


    db.query(
        sql,
        [tgl],
        (err, rows) => {

            if (err) {

                console.error(
                    'GET SUMMARY ERROR:',
                    err
                );

                return res.status(500)
                    .json({

                        success: false,

                        message:
                            'Gagal mengambil data summary'

                    });

            }


            let totalTarget = 0;
            let totalActual = 0;
            let totalDowntime = 0;

            let totalPending = 0;
            let totalRunning = 0;


            rows.forEach(row => {

                const target =
                    Number(
                        row.target_shift
                    ) || 0;


                const actual =
                    Number(
                        row.actual_qty
                    ) || 0;


                const downtime =
                    Number(
                        row.downtime_minute
                    ) || 0;


                row.target =
                    target;


                row.actual =
                    actual;


                row.downtime =
                    downtime;


                // =========================
                // MINUS
                // =========================

                row.minus =
                    actual - target;


                // =========================
                // ACHIEVEMENT
                // =========================

                row.achievement = 0;


                if (target > 0) {

                    row.achievement =
                        (
                            actual /
                            target
                        ) * 100;

                }


                // =========================
                // TOTAL
                // =========================

                totalTarget += target;

                totalActual += actual;

                totalDowntime += downtime;


                // =========================
                // STATUS
                // =========================

                if (
                    row.status === 'Pending'
                ) {

                    totalPending++;

                }
                else {

                    totalRunning++;

                }

            });


            const totalMinus =
                totalActual -
                totalTarget;


            let totalAchievement = 0;


            if (totalTarget > 0) {

                totalAchievement =
                    (
                        totalActual /
                        totalTarget
                    ) * 100;

            }


            res.json({

                success: true,

                data: rows,

                total: {

                    target:
                        totalTarget,

                    actual:
                        totalActual,

                    minus:
                        totalMinus,

                    achievement:
                        totalAchievement,

                    downtime:
                        totalDowntime,

                    pending:
                        totalPending,

                    running:
                        totalRunning

                }

            });

        }
    );

};