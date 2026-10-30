const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../../config/database2');
const MAP = require('../../config/importMap');
const { parseLaporan, summarize } = require('../../helpers/excelParser');
const { httpError } = require('../../helpers/oee');

// ---------- upload ----------
exports.upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/\.xlsx$/i.test(file.originalname)) return cb(httpError(400, 'Hanya file .xlsx yang didukung'));
    cb(null, true);
  },
}).single('file');

// ---------- penyimpanan sementara hasil pratinjau (di memori, 20 menit) ----------
const TTL = 20 * 60 * 1000;
const store = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) if (v.expires < now) store.delete(k);
}, 60 * 1000).unref();

const pad = (x) => String(x).padStart(2, '0');

async function insertChunks(conn, sql, rows, size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    await conn.query(sql, [rows.slice(i, i + size)]);
  }
}

// ---------- langkah 1: pratinjau ----------
exports.preview = async (req, res) => {
  if (!req.file) throw httpError(400, 'Pilih file Excel terlebih dahulu');
  const filePath = req.file.path;
  try {
    const parsed = await parseLaporan(filePath, req.file.originalname);
    const token = crypto.randomBytes(16).toString('hex');
    store.set(token, { rows: parsed.rows, ngNames: parsed.ngNames, fileName: req.file.originalname, expires: Date.now() + TTL });

    const sample = parsed.rows.slice(0, 8).map((r) => ({
      baris: r.rowNumber, hari: r.hari, mesin: r.mesinNo, part: r.part,
      ok: r.totalOk, ng: r.totalNg, jam_plan: r.jamPlan, downtime: r.downtimeJam,
    }));

    res.json({
      ok: true,
      token,
      file: req.file.originalname,
      deteksi: parsed.deteksi,
      ringkasan: summarize(parsed.rows),
      sample,
      warning_count: parsed.warningCount,
      warnings: parsed.warnings,
    });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

// ---------- langkah 2: simpan ke database ----------
exports.commit = async (req, res) => {
  const { token } = req.body;
  const mode = req.body.mode === 'tambah' ? 'tambah' : 'timpa';
  const bulan = parseInt(req.body.bulan, 10);
  const tahun = parseInt(req.body.tahun, 10);
  if (!(bulan >= 1 && bulan <= 12)) throw httpError(400, 'Bulan tidak valid');
  if (!(tahun >= 2000 && tahun <= 2100)) throw httpError(400, 'Tahun tidak valid');

  const entry = store.get(token);
  if (!entry) throw httpError(410, 'Sesi pratinjau sudah kedaluwarsa. Silakan unggah ulang file.');

  const lastDay = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const awal = `${tahun}-${pad(bulan)}-01`;
  const akhir = `${tahun}-${pad(bulan)}-${pad(lastDay)}`;

  // tanggal valid untuk bulan terpilih
  let dilewati = 0;
  const rows = [];
  for (const r of entry.rows) {
    if (r.hari > lastDay) { dilewati++; continue; }
    rows.push({ ...r, tanggal: `${tahun}-${pad(bulan)}-${pad(r.hari)}` });
  }
  if (!rows.length) throw httpError(400, 'Tidak ada baris yang cocok dengan bulan yang dipilih');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let dihapus = 0;
    if (mode === 'timpa') {
      const [d] = await conn.query('DELETE FROM produksi WHERE tanggal BETWEEN ? AND ?', [awal, akhir]);
      dihapus = d.affectedRows;
    }

    // --- master mesin
    const mesinInfo = new Map();
    for (const r of rows) {
      const cur = mesinInfo.get(r.mesinNo) || { brand: null, tonase: null };
      mesinInfo.set(r.mesinNo, { brand: r.brand || cur.brand, tonase: r.tonase || cur.tonase });
    }
    await conn.query(
      `INSERT INTO mesin (no_mesin, brand, tonase) VALUES ?
       ON DUPLICATE KEY UPDATE brand = COALESCE(VALUES(brand), brand), tonase = COALESCE(VALUES(tonase), tonase)`,
      [[...mesinInfo.entries()].map(([no, v]) => [no, v.brand || null, v.tonase || null])]);
    const [mRows] = await conn.query('SELECT id, no_mesin FROM mesin WHERE no_mesin IN (?)', [[...mesinInfo.keys()]]);
    const mesinId = new Map(mRows.map((m) => [m.no_mesin, m.id]));

    // --- master produk (nilai terakhir yang terisi menang)
    const produkInfo = new Map();
    for (const r of rows) {
      const k = r.part.toLowerCase();
      const cur = produkInfo.get(k) || { nama: r.part, customer: '', ct: 0, cav: 0, berat: 0, runner: 0 };
      produkInfo.set(k, {
        nama: r.part,
        customer: r.customer || cur.customer,
        ct: r.ctStd > 0 ? r.ctStd : cur.ct,
        cav: r.cavity > 0 ? r.cavity : cur.cav,
        berat: r.beratPart > 0 ? r.beratPart : cur.berat,
        runner: r.runner > 0 ? r.runner : cur.runner,
      });
    }
    await conn.query(
      `INSERT INTO produk (nama_part, customer, ct_std, cavity, berat_part, runner) VALUES ?
       ON DUPLICATE KEY UPDATE
         customer   = COALESCE(NULLIF(VALUES(customer), ''), customer),
         ct_std     = IF(VALUES(ct_std) > 0, VALUES(ct_std), ct_std),
         cavity     = IF(VALUES(cavity) > 0, VALUES(cavity), cavity),
         berat_part = IF(VALUES(berat_part) > 0, VALUES(berat_part), berat_part),
         runner     = IF(VALUES(runner) > 0, VALUES(runner), runner)`,
      [[...produkInfo.values()].map((p) => [p.nama, p.customer || null, p.ct, p.cav, p.berat, p.runner])]);
    const [pRows] = await conn.query('SELECT id, nama_part FROM produk WHERE nama_part IN (?)',
      [[...produkInfo.values()].map((p) => p.nama)]);
    const produkId = new Map(pRows.map((p) => [p.nama_part.trim().toLowerCase(), p.id]));

    // --- master downtime & NG
    await conn.query(
      `INSERT INTO downtime_jenis (nama, kelompok, masuk_oee) VALUES ?
       ON DUPLICATE KEY UPDATE kelompok = VALUES(kelompok), masuk_oee = VALUES(masuk_oee)`,
      [MAP.downtime.map((d) => [d.nama, d.kelompok, d.masukOee ? 1 : 0])]);
    const [dRows] = await conn.query('SELECT id, nama FROM downtime_jenis');
    const dtId = new Map(dRows.map((d) => [d.nama, d.id]));

    await conn.query('INSERT IGNORE INTO ng_jenis (nama) VALUES ?', [entry.ngNames.map((x) => [x])]);
    const [nRows] = await conn.query('SELECT id, nama FROM ng_jenis');
    const ngId = new Map(nRows.map((x) => [x.nama, x.id]));

    // --- log import
    const [log] = await conn.query('INSERT INTO import_log SET ?', {
      nama_file: entry.fileName.slice(0, 255), bulan, tahun, mode,
      baris_diimpor: rows.length, baris_dilewati: dilewati,
    });
    const importId = log.insertId;

    // --- baris produksi + detail
    const dtRowsOut = [];
    const ngRowsOut = [];
    for (const r of rows) {
      const pid = produkId.get(r.part.toLowerCase());
      const [ins] = await conn.query('INSERT INTO produksi SET ?', {
        tanggal: r.tanggal,
        mesin_id: mesinId.get(r.mesinNo),
        produk_id: pid,
        material: r.material || null,
        ct_std: r.ctStd, cavity: r.cavity, jam_plan: r.jamPlan,
        target_qty: r.targetQty, downtime_jam: r.downtimeJam,
        ok_s1: r.ok[0], ng_s1: r.ng[0], ok_s2: r.ok[1], ng_s2: r.ng[1], ok_s3: r.ok[2], ng_s3: r.ng[2],
        operator_s1: r.operator[0] || null, operator_s2: r.operator[1] || null, operator_s3: r.operator[2] || null,
        pic_s1: r.pic[0] || null, pic_s2: r.pic[1] || null, pic_s3: r.pic[2] || null,
        ket_s1: r.ket[0] || null, ket_s2: r.ket[1] || null, ket_s3: r.ket[2] || null,
        import_id: importId,
      });
      for (const d of r.downtime) dtRowsOut.push([ins.insertId, dtId.get(d.nama), d.jam]);
      for (const g of r.ngDetail) ngRowsOut.push([ins.insertId, ngId.get(g.nama), g.qty]);
    }
    await insertChunks(conn, 'INSERT INTO produksi_downtime (produksi_id, jenis_id, jam) VALUES ?', dtRowsOut);
    await insertChunks(conn, 'INSERT INTO produksi_ng (produksi_id, jenis_id, qty) VALUES ?', ngRowsOut);

    // bersihkan riwayat import lama yang barisnya sudah tertimpa semua
    await conn.query(
      'DELETE FROM import_log WHERE id <> ? AND id NOT IN (SELECT DISTINCT import_id FROM produksi WHERE import_id IS NOT NULL)',
      [importId]);

    await conn.commit();
    store.delete(token);
    res.json({ ok: true, diimpor: rows.length, dilewati, dihapus, import_id: importId, periode: `${pad(bulan)}/${tahun}` });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// ---------- riwayat ----------
exports.history = async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.id, l.nama_file, l.bulan, l.tahun, l.mode, l.baris_diimpor, l.baris_dilewati, l.created_at,
            (SELECT COUNT(*) FROM produksi WHERE import_id = l.id) AS baris_aktif
       FROM import_log l ORDER BY l.id DESC LIMIT 50`);
  res.json({ ok: true, rows });
};

// ---------- hapus batch import ----------
exports.removeBatch = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, 'ID import tidak valid');
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [logs] = await conn.query(
      'SELECT id FROM import_log WHERE id = ? FOR UPDATE',
      [id]
    );

    if (!logs.length) {
      throw httpError(404, 'Riwayat import tidak ditemukan');
    }

    const [produksi] = await conn.query(
      'SELECT id FROM produksi WHERE import_id = ?',
      [id]
    );

    const produksiIds = produksi.map((row) => row.id);

    if (produksiIds.length) {
      await conn.query(
        'DELETE FROM produksi_downtime WHERE produksi_id IN (?)',
        [produksiIds]
      );

      await conn.query(
        'DELETE FROM produksi_ng WHERE produksi_id IN (?)',
        [produksiIds]
      );

      await conn.query(
        'DELETE FROM produksi WHERE import_id = ?',
        [id]
      );
    }

    await conn.query(
      'DELETE FROM import_log WHERE id = ?',
      [id]
    );

    await conn.commit();

    res.json({
      ok: true,
      message: 'Batch import berhasil dihapus',
      jumlah_produksi: produksiIds.length
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};