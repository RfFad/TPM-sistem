const db = require('../../config/database2');
const { buildWhere, httpError, n } = require('../../helpers/oee');

/** Daftar baris produksi (server-side pagination + pencarian). */
exports.list = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 25));
  const w = buildWhere(req.query);

  let where = w.sql;
  const params = [...w.params];
  const q = String(req.query.q || '').trim();
  if (q) {
    where += (where ? ' AND ' : 'WHERE ') + '(pr.nama_part LIKE ? OR p.material LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  const [[cnt]] = await db.query(
    `SELECT COUNT(*) AS c FROM produksi p JOIN produk pr ON pr.id = p.produk_id ${where}`, params);

  const [rows] = await db.query(
    `SELECT p.id, p.tanggal, m.no_mesin, pr.nama_part, pr.customer,
            p.total_ok, p.total_ng, p.total_produksi, p.jam_plan, p.downtime_jam, p.target_qty,
            IF(p.jam_plan > 0, 1 - LEAST(p.downtime_jam, p.jam_plan) / p.jam_plan, 0) AS availability,
            IF(p.target_qty > 0, p.total_produksi / p.target_qty, 0) AS performance,
            IF(p.total_produksi > 0, p.total_ok / p.total_produksi, 0) AS quality
       FROM produksi p
       JOIN mesin m   ON m.id  = p.mesin_id
       JOIN produk pr ON pr.id = p.produk_id
       ${where}
      ORDER BY p.tanggal DESC, m.no_mesin, p.id
      LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    ok: true,
    page, limit,
    total: n(cnt.c),
    rows: rows.map((r) => {
      const a = n(r.availability), pf = n(r.performance), qu = n(r.quality);
      return { ...r, availability: a, performance: pf, quality: qu, oee: a * pf * qu };
    }),
  });
};

/** Detail satu baris: shift, downtime, NG. */
exports.detail = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) throw httpError(400, 'ID tidak valid');
  const [[row]] = await db.query(
    `SELECT p.*, m.no_mesin, m.brand, m.tonase, pr.nama_part, pr.customer
       FROM produksi p JOIN mesin m ON m.id = p.mesin_id JOIN produk pr ON pr.id = p.produk_id
      WHERE p.id = ?`, [id]);
  if (!row) throw httpError(404, 'Data tidak ditemukan');

  const [[downtime], [ng]] = await Promise.all([
    db.query(`SELECT j.nama, j.masuk_oee, d.jam FROM produksi_downtime d JOIN downtime_jenis j ON j.id = d.jenis_id
               WHERE d.produksi_id = ? ORDER BY d.jam DESC`, [id]),
    db.query(`SELECT j.nama, x.qty FROM produksi_ng x JOIN ng_jenis j ON j.id = x.jenis_id
               WHERE x.produksi_id = ? ORDER BY x.qty DESC`, [id]),
  ]);
  res.json({ ok: true, row, downtime, ng });
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) throw httpError(400, 'ID tidak valid');
  const [r] = await db.query('DELETE FROM produksi WHERE id = ?', [id]);
  if (!r.affectedRows) throw httpError(404, 'Data tidak ditemukan');
  res.json({ ok: true });
};
