/**
 * Rumus OEE yang dipakai di seluruh sistem (agregat tertimbang, bukan rata-rata persentase):
 *   Availability = 1 - total downtime / total jam planning
 *   Performance  = total produksi (OK+NG) / total target (CT standar x cavity x jam planning)
 *   Quality      = total OK / total produksi
 *   OEE          = A x P x Q
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ids = (v) =>
  String(v || '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n > 0);

/** Bangun klausa WHERE dari query string. Alias tabel produksi harus `p`. */
function buildWhere(q = {}, extra = []) {
  const conds = [...extra];
  const params = [];
  if (DATE_RE.test(q.dari || '')) { conds.push('p.tanggal >= ?'); params.push(q.dari); }
  if (DATE_RE.test(q.sampai || '')) { conds.push('p.tanggal <= ?'); params.push(q.sampai); }
  const m = ids(q.mesin);
  if (m.length) { conds.push('p.mesin_id IN (?)'); params.push(m); }
  const pr = ids(q.produk);
  if (pr.length) { conds.push('p.produk_id IN (?)'); params.push(pr); }
  const cust = String(q.customer || '').trim();
  if (cust) { conds.push('p.produk_id IN (SELECT id FROM produk WHERE customer = ?)'); params.push(cust); }
  return { sql: conds.length ? 'WHERE ' + conds.join(' AND ') : '', params };
}

const A = 'IFNULL(1 - SUM(LEAST(p.downtime_jam, p.jam_plan)) / NULLIF(SUM(p.jam_plan), 0), 0)';
const P = 'IFNULL(SUM(CASE WHEN p.target_qty > 0 THEN p.total_produksi END) / NULLIF(SUM(p.target_qty), 0), 0)';
const Q = 'IFNULL(SUM(p.total_ok) / NULLIF(SUM(p.total_produksi), 0), 0)';

/** Kolom agregat standar untuk query GROUP BY maupun total. */
const KPI_COLS = `
  SUM(p.total_produksi) AS total_produksi,
  SUM(p.total_ok)       AS total_ok,
  SUM(p.total_ng)       AS total_ng,
  SUM(p.jam_plan)       AS jam_plan,
  SUM(p.downtime_jam)   AS downtime_jam,
  ${A} AS availability,
  ${P} AS performance,
  ${Q} AS quality,
  (${A}) * (${P}) * (${Q}) AS oee`;

const n = (v) => (v === null || v === undefined ? 0 : Number(v) || 0);

function mapKpi(r) {
  r = r || {};
  const total = n(r.total_produksi);
  return {
    total_produksi: total,
    total_ok: n(r.total_ok),
    total_ng: n(r.total_ng),
    pct_ng: total > 0 ? n(r.total_ng) / total : 0,
    jam_plan: n(r.jam_plan),
    downtime_jam: n(r.downtime_jam),
    availability: n(r.availability),
    performance: n(r.performance),
    quality: n(r.quality),
    oee: n(r.oee),
  };
}

/** Periode pembanding: rentang sama panjang tepat sebelum `dari`. */
function previousRange(dari, sampai) {
  if (!DATE_RE.test(dari || '') || !DATE_RE.test(sampai || '')) return null;
  const d1 = Date.parse(dari + 'T00:00:00Z');
  const d2 = Date.parse(sampai + 'T00:00:00Z');
  if (isNaN(d1) || isNaN(d2) || d2 < d1) return null;
  const days = Math.round((d2 - d1) / 86400000) + 1;
  const prevEnd = d1 - 86400000;
  const prevStart = prevEnd - (days - 1) * 86400000;
  const f = (t) => new Date(t).toISOString().slice(0, 10);
  return { dari: f(prevStart), sampai: f(prevEnd) };
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { buildWhere, KPI_COLS, mapKpi, previousRange, httpError, n };
