$(function () {
  const F = OEE.fmt;
  const COL = { primary: '#4f6bed', green: '#1fb980', amber: '#f6a609', red: '#ef4b5f', cyan: '#17a2c8', purple: '#8a63d2' };
  const charts = {};
  let level = 'bulan';
  let rows = [];
  Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
  Chart.defaults.color = '#5b6783';

  const p100 = (v) => Math.round((v || 0) * 1000) / 10;
  function mk(id, cfg) {
    if (charts[id]) charts[id].destroy();
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    charts[id] = new Chart(document.getElementById(id), cfg);
  }

  function label(r) {
    if (level === 'minggu') return `W${String(r.kunci).slice(4).replace(/^0/, '')}/${String(r.kunci).slice(0, 4)}`;
    if (level === 'bulan') { const [y, m] = r.kunci.split('-'); return `${OEE.BULAN_S[+m - 1]} ${y}`; }
    return r.kunci;
  }
  const rangeText = (r) => (level === 'tahun' ? '' : `${F.tgl(r.mulai)} – ${F.tgl(r.selesai)}`);

  function chg(cur, prev) { return prev ? ((cur - prev) / prev) * 100 : null; }
  function deltaCell(v, suffix, inverse) {
    if (v == null) return '<span class="text-muted">-</span>';
    if (Math.abs(v) < 0.05) return '<span class="text-muted">0</span>';
    const up = v > 0, good = inverse ? !up : up;
    return `<span class="${good ? 'text-success' : 'text-danger'}">${up ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}${suffix}</span>`;
  }

  function render() {
    // tabel
    const $tb = $('#tblRekap tbody').empty();
    rows.forEach((r, i) => {
      const prev = i > 0 ? rows[i - 1] : null;
      $tb.append(`<tr>
        <td><strong>${label(r)}</strong><div class="text-muted" style="font-size:.72rem">${rangeText(r)}</div></td>
        <td class="text-end">${r.hari_produksi}</td>
        <td class="text-end">${F.int(r.total_produksi)}</td>
        <td class="text-end">${prev ? deltaCell(chg(r.total_produksi, prev.total_produksi), '%') : '-'}</td>
        <td class="text-end">${F.int(r.total_ok)}</td><td class="text-end">${F.int(r.total_ng)}</td><td class="text-end">${F.pct(r.pct_ng)}</td>
        <td class="text-end">${F.dec1(r.downtime_jam)}</td>
        <td class="text-end">${F.pct(r.availability)}</td><td class="text-end">${F.pct(r.performance)}</td><td class="text-end">${F.pct(r.quality)}</td>
        <td class="text-end">${OEE.oeeBadge(r.oee)}</td>
        <td class="text-end">${prev ? deltaCell((r.oee - prev.oee) * 100, ' poin') : '-'}</td></tr>`);
    });
    if (!rows.length) $tb.append('<tr><td colspan="13" class="text-center text-muted py-4">Tidak ada data untuk filter ini</td></tr>');

    const lb = rows.map(label);

    mk('cProd', {
      data: {
        labels: lb,
        datasets: [
          { type: 'bar', label: 'OK', data: rows.map((r) => r.total_ok), backgroundColor: COL.green, stack: 's', borderRadius: 3 },
          { type: 'bar', label: 'NG', data: rows.map((r) => r.total_ng), backgroundColor: COL.red, stack: 's', borderRadius: 3 },
          { type: 'line', label: 'OEE', data: rows.map((r) => p100(r.oee)), borderColor: COL.primary, backgroundColor: COL.primary, yAxisID: 'y1', tension: .25, borderWidth: 3, pointRadius: 4 },
          { type: 'line', label: 'Target', data: rows.map(() => Math.round(OEE.target() * 100)), borderColor: COL.amber, borderDash: [6, 5], yAxisID: 'y1', pointRadius: 0, borderWidth: 1.5 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { stacked: true }, y: { stacked: true, ticks: { callback: (x) => F.int(x) } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, suggestedMin: 0, ticks: { callback: (x) => x + '%' } },
        },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    mk('cApq', {
      type: 'line',
      data: {
        labels: lb,
        datasets: [
          { label: 'Availability', data: rows.map((r) => p100(r.availability)), borderColor: COL.cyan, tension: .25, borderWidth: 2, pointRadius: 3 },
          { label: 'Performance', data: rows.map((r) => p100(r.performance)), borderColor: COL.purple, tension: .25, borderWidth: 2, pointRadius: 3 },
          { label: 'Quality', data: rows.map((r) => p100(r.quality)), borderColor: COL.green, tension: .25, borderWidth: 2, pointRadius: 3 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: { y: { ticks: { callback: (x) => x + '%' } } },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    mk('cLoss', {
      data: {
        labels: lb,
        datasets: [
          { type: 'bar', label: 'Downtime (jam)', data: rows.map((r) => r.downtime_jam), backgroundColor: COL.amber, borderRadius: 3 },
          { type: 'line', label: '% NG', data: rows.map((r) => p100(r.pct_ng)), borderColor: COL.red, backgroundColor: COL.red, yAxisID: 'y1', tension: .25, borderWidth: 2, pointRadius: 3 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: { y1: { position: 'right', grid: { drawOnChartArea: false }, suggestedMin: 0, ticks: { callback: (x) => x + '%' } } },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    // dropdown perbandingan: A = kedua terakhir, B = terakhir
    const opts = rows.map((r, i) => `<option value="${i}">${label(r)}</option>`).join('');
    $('#cmpA').html(opts).val(Math.max(0, rows.length - 2));
    $('#cmpB').html(opts).val(Math.max(0, rows.length - 1));
    compare();
  }

  const METRICS = [
    ['Total produksi (pcs)', 'total_produksi', F.int, 'vol'],
    ['Total OK (pcs)', 'total_ok', F.int, 'vol'],
    ['Total NG (pcs)', 'total_ng', F.int, 'vol-inv'],
    ['% NG', 'pct_ng', F.pct, 'pt-inv'],
    ['Downtime (jam)', 'downtime_jam', F.dec1, 'vol-inv'],
    ['Availability', 'availability', F.pct, 'pt'],
    ['Performance', 'performance', F.pct, 'pt'],
    ['Quality', 'quality', F.pct, 'pt'],
    ['OEE', 'oee', F.pct, 'pt'],
  ];

  function compare() {
    const a = rows[+$('#cmpA').val()], b = rows[+$('#cmpB').val()];
    const $tb = $('#tblCmp tbody').empty();
    if (!a || !b) return;
    METRICS.forEach(([name, key, f, kind]) => {
      const inv = kind.endsWith('-inv');
      let selisih, perubahan;
      if (kind.startsWith('pt')) {
        const d = (b[key] - a[key]) * 100;
        selisih = (d >= 0 ? '+' : '') + d.toFixed(1) + ' poin';
        perubahan = deltaCell(d, ' poin', inv);
      } else {
        const d = b[key] - a[key];
        selisih = (d >= 0 ? '+' : '') + f(d);
        perubahan = deltaCell(chg(b[key], a[key]), '%', inv);
      }
      $tb.append(`<tr><td>${name}</td><td class="text-end">${f(a[key])}</td><td class="text-end">${f(b[key])}</td><td class="text-end">${selisih}</td><td class="text-end">${perubahan}</td></tr>`);
    });
  }

  function load() {
    $('#loading').removeClass('d-none');
    $.getJSON('/api/rekap', Object.assign({ level }, OEE.clean(OEE.getFilter())))
      .done((res) => { rows = res.rows; render(); })
      .fail(OEE.ajaxError)
      .always(() => $('#loading').addClass('d-none'));
  }

  $('#levelTabs button').on('click', function () {
    level = $(this).data('level');
    $('#levelTabs button').removeClass('active');
    $(this).addClass('active');
    load();
  });
  $('#cmpA, #cmpB').on('change', compare);

  $('#btnCsv').on('click', function () {
    if (!rows.length) return OEE.toast('Tidak ada data untuk diunduh', 'warning');
    const head = ['Periode', 'Mulai', 'Selesai', 'Hari Produksi', 'Total Produksi', 'OK', 'NG', 'Persen NG', 'Downtime Jam', 'Availability', 'Performance', 'Quality', 'OEE'];
    const lines = [head.join(';')].concat(rows.map((r) => [
      label(r), r.mulai, r.selesai, r.hari_produksi, r.total_produksi, r.total_ok, r.total_ng,
      (r.pct_ng * 100).toFixed(2), r.downtime_jam, (r.availability * 100).toFixed(2), (r.performance * 100).toFixed(2),
      (r.quality * 100).toFixed(2), (r.oee * 100).toFixed(2),
    ].join(';')));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rekap-${level}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  OEE.initFilter(load, 'tahun');
});
