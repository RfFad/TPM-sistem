const ExcelJS = require('exceljs');
const MAP = require('../config/importMap');
const { httpError } = require('./oee');

const BULAN = {
  JANUARI: 1, FEBRUARI: 2, MARET: 3, APRIL: 4, MEI: 5, JUNI: 6,
  JULI: 7, AGUSTUS: 8, SEPTEMBER: 9, OKTOBER: 10, NOVEMBER: 11, DESEMBER: 12,
};

const colIdx = (letters) => letters.toUpperCase().split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);

const num = (v) => {
  if (v === null || v === undefined || v === '' || v instanceof Date) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const x = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};

const str = (v) => {
  if (v === null || v === undefined || v instanceof Date) return '';
  if (typeof v === 'number') return v === 0 ? '' : String(v);
  return String(v).replace(/\s+/g, ' ').trim();
};

const round2 = (x) => Math.round(x * 100) / 100;

function detectPeriode(fileName) {
  const up = String(fileName || '').toUpperCase();
  let bulan = null;
  for (const [k, v] of Object.entries(BULAN)) {
    if (up.includes(k)) { bulan = v; break; }
  }
  const y = up.match(/(20\d{2})/);
  return { bulan, tahun: y ? parseInt(y[1], 10) : null };
}

/**
 * Baca sheet LAPORAN. Nilai sel rumus diambil dari hasil hitung terakhir yang
 * tersimpan di file (cached value) -> file harus pernah dibuka & disimpan di Excel.
 */
async function parseLaporan(filePath, originalName) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(filePath);
  } catch (e) {
    throw httpError(400, 'File tidak bisa dibaca. Pastikan formatnya .xlsx yang valid.');
  }

  const ws = wb.worksheets.find((s) => s.name.trim().toUpperCase() === MAP.sheetName.toUpperCase());
  if (!ws) {
    throw httpError(400, `Sheet "${MAP.sheetName}" tidak ditemukan. Sheet di file ini: ${wb.worksheets.map((s) => s.name).join(', ')}`);
  }

  const stats = { noCache: 0 };
  const raw = (cell) => {
    let v = cell.value;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      if ('result' in v) v = v.result;
      else if ('formula' in v || 'sharedFormula' in v) { stats.noCache++; return null; }
      else if (Array.isArray(v.richText)) v = v.richText.map((t) => t.text).join('');
      else if ('text' in v) v = v.text;
      else return null;
    }
    if (v && typeof v === 'object' && !(v instanceof Date)) return null; // mis. {error:'#N/A'}
    return v === undefined ? null : v;
  };

  // Jenis NG: dibaca dari header
  const hdr = ws.getRow(MAP.ngHeaderRow);
  const ngCols = [];
  const seen = {};
  for (let c = colIdx(MAP.ngStartCol); c < colIdx(MAP.ngStartCol) + 120; c++) {
    let name = str(raw(hdr.getCell(c))).toUpperCase();
    if (!name || name === MAP.ngStopHeader.toUpperCase()) break;
    seen[name] = (seen[name] || 0) + 1;
    if (seen[name] > 1) name = `${name} (${seen[name]})`; // nama kembar (mis. BENDING) dibedakan
    ngCols.push({ idx: c, nama: name });
  }
  if (!ngCols.length) throw httpError(400, `Header jenis NG tidak ditemukan di baris ${MAP.ngHeaderRow} mulai kolom ${MAP.ngStartCol}.`);

  const C = MAP.cols;
  const rows = [];
  const warnings = [];
  let warningCount = 0;
  const warn = (baris, pesan) => { warningCount++; if (warnings.length < 200) warnings.push({ baris, pesan }); };
  let dateHint = null;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < MAP.firstDataRow) return;
    const g = (letters) => raw(row.getCell(colIdx(letters)));

    const dRaw = g(C.hari);
    const partRaw = str(g(C.part));
    const mesinNo = Math.round(num(g(C.mesin)));

    let hari = 0;
    if (dRaw instanceof Date) {
      hari = dRaw.getUTCDate();
      if (!dateHint) dateHint = { bulan: dRaw.getUTCMonth() + 1, tahun: dRaw.getUTCFullYear() };
    } else {
      hari = Math.round(num(dRaw));
    }

    // baris kosong / baris total -> lewati diam-diam
    if (!hari && !partRaw && !mesinNo) return;
    if (hari < 1 || hari > 31) { warn(rowNumber, 'Tanggal (kolom ' + C.hari + ') tidak valid, baris dilewati'); return; }

    const ok = C.ok.map((c) => Math.round(num(g(c))));
    const ng = C.ng.map((c) => Math.round(num(g(c))));
    const totalOk = ok[0] + ok[1] + ok[2];
    const totalNg = ng[0] + ng[1] + ng[2];
    const total = totalOk + totalNg;

    if (!mesinNo) { warn(rowNumber, `No mesin kosong, baris dilewati (${total} pcs tidak ikut terimpor)`); return; }
    let part = partRaw;
    if (!part) {
      if (total === 0) { warn(rowNumber, 'Nama part kosong dan tidak ada produksi, baris dilewati'); return; }
      part = '(TANPA NAMA PART)';
      warn(rowNumber, `Nama part kosong (kolom ${C.part}); ${total} pcs tetap diimpor sebagai "${part}". Sebaiknya dilengkapi di Excel.`);
    }

    const ctStd = num(g(C.ctStd));
    const cavity = Math.round(num(g(C.cavity)));
    const jamPlan = round2(C.jamPlan.reduce((s, c) => s + num(g(c)), 0));
    const targetQty = ctStd > 0 && cavity > 0 ? round2((3600 / ctStd) * cavity * jamPlan) : 0;

    const downtime = [];
    let downtimeJam = 0;
    for (const d of MAP.downtime) {
      const jam = round2(num(g(d.col)));
      if (jam > 0) {
        downtime.push({ nama: d.nama, jam });
        if (d.masukOee) downtimeJam += jam;
      }
    }
    downtimeJam = round2(downtimeJam);

    const ngDetail = [];
    let ngSum = 0;
    for (const n of ngCols) {
      const q = Math.round(num(raw(row.getCell(n.idx))));
      if (q > 0) { ngDetail.push({ nama: n.nama, qty: q }); ngSum += q; }
    }

    if (ctStd <= 0) warn(rowNumber, `CT standar kosong/0 untuk "${part}" -> target & performance tidak dihitung`);
    if (ngSum !== totalNg) warn(rowNumber, `Total NG per shift (${totalNg}) tidak sama dengan jumlah NG per jenis (${ngSum})`);
    if (targetQty > 0 && total / targetQty > 1.2) warn(rowNumber, `Performance ${(total / targetQty * 100).toFixed(0)}% (>120%), cek jam planning / CT standar`);
    if (downtimeJam > jamPlan && jamPlan > 0) warn(rowNumber, `Downtime (${downtimeJam} jam) melebihi jam planning (${jamPlan} jam)`);

    rows.push({
      rowNumber, hari, mesinNo,
      tonase: Math.round(num(g(C.tonase))) || null,
      brand: typeof g(C.brand) === 'string' ? str(g(C.brand)) : '',
      part,
      customer: typeof g(C.customer) === 'string' ? str(g(C.customer)) : '',
      material: str(g(C.material)),
      ctStd, cavity,
      beratPart: num(g(C.beratPart)),
      runner: num(g(C.runner)),
      jamPlan, targetQty, downtimeJam,
      ok, ng, totalOk, totalNg, total,
      operator: C.operator.map((c) => str(g(c))),
      pic: C.pic.map((c) => str(g(c))),
      ket: C.ket.map((c) => str(g(c)).slice(0, 500)),
      downtime, ngDetail,
    });
  });

  if (!rows.length) throw httpError(400, 'Tidak ada baris data yang valid di sheet ' + MAP.sheetName + '.');
  if (stats.noCache > 0) {
    warn(0, `${stats.noCache} sel berisi rumus tanpa hasil tersimpan (nilai dianggap 0). Buka file di Excel lalu Save sekali sebelum diimpor.`);
  }

  const fromName = detectPeriode(originalName);
  const deteksi = {
    bulan: (dateHint && dateHint.bulan) || fromName.bulan,
    tahun: (dateHint && dateHint.tahun) || fromName.tahun,
  };

  return { rows, ngNames: ngCols.map((n) => n.nama), warnings, warningCount, deteksi };
}

/** Ringkasan untuk halaman pratinjau. */
function summarize(rows) {
  const sum = (f) => rows.reduce((s, r) => s + f(r), 0);
  const jamPlan = sum((r) => r.jamPlan);
  const dt = sum((r) => Math.min(r.downtimeJam, r.jamPlan));
  const withTarget = rows.filter((r) => r.targetQty > 0);
  const total = sum((r) => r.total);
  const A = jamPlan > 0 ? 1 - dt / jamPlan : 0;
  const tgtSum = withTarget.reduce((s, r) => s + r.targetQty, 0);
  const P = tgtSum > 0 ? withTarget.reduce((s, r) => s + r.total, 0) / tgtSum : 0;
  const Q = total > 0 ? sum((r) => r.totalOk) / total : 0;
  const hari = rows.map((r) => r.hari);
  return {
    totalBaris: rows.length,
    hariMin: Math.min(...hari),
    hariMax: Math.max(...hari),
    jumlahMesin: new Set(rows.map((r) => r.mesinNo)).size,
    jumlahPart: new Set(rows.map((r) => r.part.toLowerCase())).size,
    totalProduksi: total,
    totalOk: sum((r) => r.totalOk),
    totalNg: sum((r) => r.totalNg),
    availability: A, performance: P, quality: Q, oee: A * P * Q,
  };
}

module.exports = { parseLaporan, summarize, detectPeriode };
