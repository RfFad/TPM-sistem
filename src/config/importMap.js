/**
 * Pemetaan kolom Excel (sheet LAPORAN) -> database.
 * Kalau layout Excel berubah (kolom bergeser), cukup ubah huruf kolom di sini.
 * Header jenis NG dibaca otomatis dari baris `ngHeaderRow`, mulai kolom `ngStartCol`
 * sampai ketemu header "TOTAL", jadi menambah jenis NG baru tidak perlu ubah kode.
 */
module.exports = {
  sheetName: 'LAPORAN',
  firstDataRow: 6,

  cols: {
    hari: 'D',        // tanggal (angka 1-31)
    mesin: 'E',       // MC NO
    tonase: 'F',      // MC TON
    brand: 'G',       // BRAND MC
    part: 'H',        // PART NAME
    customer: 'I',
    material: 'J',
    ctStd: 'L',       // C.T. STD (detik)
    cavity: 'O',
    beratPart: 'R',
    runner: 'S',
    jamPlan: ['U', 'V', 'W'],          // jam kerja planning shift 1-3
    ok: ['AC', 'AL', 'AU'],            // OK shift 1-3
    ng: ['AD', 'AM', 'AV'],            // NG shift 1-3
    operator: ['AJ', 'AS', 'BB'],
    pic: ['AK', 'AT', 'BC'],
    ket: ['BZ', 'CA', 'CB'],           // keterangan shift 1-3
  },

  // Downtime (jam). masukOee=false -> disimpan tapi TIDAK mengurangi availability
  // (sama seperti rumus Excel: total downtime = SUM(CC:CT), kolom PPIC tidak ikut).
  downtime: [
    { col: 'CC', nama: 'GANTI MOLD', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CD', nama: 'MC SETTING', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CE', nama: 'CUCI BAREL + CENTER NOZZLE', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CF', nama: 'MC TROUBLE', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CG', nama: 'TRIAL MOLD', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CH', nama: 'TRIAL MATERIAL', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CI', nama: 'MOLD PROBLEM', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CJ', nama: 'CLEANING MOLD', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CK', nama: 'OVEN MATERIAL', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CL', nama: 'NO OPR', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CM', nama: 'PROBLEM MATERIAL', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CN', nama: 'PROBLEM COMPONEN', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CO', nama: 'EQUIPMENT PROBLEM', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CP', nama: 'ELECTRIC OFF', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CQ', nama: 'START UP TIME', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CR', nama: 'LAIN-LAIN', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CS', nama: 'MC STOP', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CT', nama: 'DOWNTIME KOMPONEN', kelompok: 'PRODUKSI', masukOee: true },
    { col: 'CU', nama: 'PPIC - NO MATERIAL', kelompok: 'PPIC', masukOee: false },
    { col: 'CV', nama: 'PPIC - NO PACKING', kelompok: 'PPIC', masukOee: false },
    { col: 'CW', nama: 'PPIC - NO TUBE', kelompok: 'PPIC', masukOee: false },
  ],

  ngHeaderRow: 4,
  ngStartCol: 'CY',
  ngStopHeader: 'TOTAL',
};
