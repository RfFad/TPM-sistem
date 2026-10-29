const db = require('../../config/database2');
const { buildWhere, KPI_COLS, mapKpi, httpError } = require('../../helpers/oee');

const GROUPS = {
  minggu: "YEARWEEK(p.tanggal, 3)",          // minggu ISO (Senin-Minggu), contoh 202632
  bulan: "DATE_FORMAT(p.tanggal, '%Y-%m')",  // contoh 2026-08
  tahun: 'YEAR(p.tanggal)',                  // contoh 2026
};

/** Rekap per minggu / bulan / tahun. Perbandingan antar periode dihitung di sisi client. */
exports.rekap = async (req, res) => {
  const level = req.query.level || 'bulan';
  const groupExpr = GROUPS[level];
  if (!groupExpr) throw httpError(400, 'level harus minggu, bulan, atau tahun');

  const w = buildWhere(req.query);
  const [rows] = await db.query(
    `SELECT ${groupExpr} AS kunci,
            MIN(p.tanggal) AS mulai, MAX(p.tanggal) AS selesai,
            COUNT(DISTINCT p.tanggal) AS hari_produksi,
            ${KPI_COLS}
       FROM produksi p ${w.sql}
      GROUP BY kunci ORDER BY kunci`,
    w.params
  );

  res.json({
    ok: true,
    level,
    rows: rows.map((r) => ({
      kunci: String(r.kunci),
      mulai: r.mulai,
      selesai: r.selesai,
      hari_produksi: Number(r.hari_produksi) || 0,
      ...mapKpi(r),
    })),
  });
};
