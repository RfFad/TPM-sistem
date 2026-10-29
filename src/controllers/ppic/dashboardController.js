const db = require('../../config/database2');
const { buildWhere, KPI_COLS, mapKpi, previousRange, n } = require('../../helpers/oee');

/** Opsi untuk dropdown filter + rentang tanggal data. */
exports.options = async (req, res) => {
  const [[mesin], [customer], [produk], [range]] = await Promise.all([
    db.query('SELECT id, no_mesin, brand, tonase FROM mesin ORDER BY no_mesin'),
    db.query("SELECT DISTINCT customer FROM produk WHERE customer IS NOT NULL AND customer <> '' ORDER BY customer"),
    db.query('SELECT id, nama_part FROM produk ORDER BY nama_part'),
    db.query('SELECT MIN(tanggal) AS min_tgl, MAX(tanggal) AS max_tgl, COUNT(*) AS total FROM produksi'),
  ]);
  res.json({
    ok: true,
    mesin,
    customer: customer.map((c) => c.customer),
    produk,
    min_tgl: range[0].min_tgl,
    max_tgl: range[0].max_tgl,
    total: n(range[0].total),
  });
};

/** Semua data dashboard dalam satu request. */
exports.summary = async (req, res) => {
  const w = buildWhere(req.query);
  const wDt = buildWhere(req.query, ['j.masuk_oee = 1']);
  const prev = previousRange(req.query.dari, req.query.sampai);
  const wPrev = prev ? buildWhere({ ...req.query, dari: prev.dari, sampai: prev.sampai }) : null;

  const [
    [kpiRows], [prevRows], [trend], [perMesin], [shiftRows], [ngRows], [dtRows], [topPart],
  ] = await Promise.all([
    db.query(`SELECT ${KPI_COLS} FROM produksi p ${w.sql}`, w.params),
    wPrev ? db.query(`SELECT ${KPI_COLS} FROM produksi p ${wPrev.sql}`, wPrev.params) : Promise.resolve([[]]),
    db.query(`SELECT p.tanggal, ${KPI_COLS} FROM produksi p ${w.sql} GROUP BY p.tanggal ORDER BY p.tanggal`, w.params),
    db.query(
      `SELECT m.no_mesin, m.brand, ${KPI_COLS}
         FROM produksi p JOIN mesin m ON m.id = p.mesin_id ${w.sql}
        GROUP BY m.id ORDER BY m.no_mesin`, w.params),
    db.query(
      `SELECT SUM(p.ok_s1) ok1, SUM(p.ng_s1) ng1, SUM(p.ok_s2) ok2, SUM(p.ng_s2) ng2,
              SUM(p.ok_s3) ok3, SUM(p.ng_s3) ng3 FROM produksi p ${w.sql}`, w.params),
    db.query(
      `SELECT j.nama, SUM(x.qty) AS qty
         FROM produksi_ng x JOIN produksi p ON p.id = x.produksi_id JOIN ng_jenis j ON j.id = x.jenis_id
        ${w.sql} GROUP BY j.id ORDER BY qty DESC`, w.params),
    db.query(
      `SELECT j.nama, SUM(d.jam) AS jam
         FROM produksi_downtime d JOIN produksi p ON p.id = d.produksi_id JOIN downtime_jenis j ON j.id = d.jenis_id
        ${wDt.sql} GROUP BY j.id ORDER BY jam DESC`, wDt.params),
    db.query(
      `SELECT pr.nama_part, ${KPI_COLS}
         FROM produksi p JOIN produk pr ON pr.id = p.produk_id ${w.sql}
        GROUP BY pr.id ORDER BY total_produksi DESC LIMIT 10`, w.params),
  ]);

  const kpi = mapKpi(kpiRows[0]);
  const prevKpi = prevRows[0] && n(prevRows[0].total_produksi) > 0 ? mapKpi(prevRows[0]) : null;
  const s = shiftRows[0] || {};
  const shift = [1, 2, 3].map((i) => {
    const ok = n(s['ok' + i]);
    const ng = n(s['ng' + i]);
    return { shift: i, ok, ng, total: ok + ng, pct_ng: ok + ng > 0 ? ng / (ok + ng) : 0 };
  });

  res.json({
    ok: true,
    kpi,
    prev: prevKpi,
    prev_range: prev,
    trend: trend.map((r) => ({ tanggal: r.tanggal, ...mapKpi(r) })),
    mesin: perMesin.map((r) => ({ no_mesin: r.no_mesin, brand: r.brand, ...mapKpi(r) })),
    shift,
    ng: ngRows.map((r) => ({ nama: r.nama, qty: n(r.qty) })),
    downtime: dtRows.map((r) => ({ nama: r.nama, jam: n(r.jam) })),
    top_part: topPart.map((r) => ({ nama_part: r.nama_part, ...mapKpi(r) })),
  });
};
