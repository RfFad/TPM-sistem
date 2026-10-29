$(function () {
  const F = OEE.fmt;
  const COL = { primary: '#4f6bed', green: '#1fb980', amber: '#f6a609', red: '#ef4b5f', cyan: '#17a2c8', purple: '#8a63d2', gray: '#9aa5b8' };
  const PALETTE = ['#4f6bed', '#1fb980', '#f6a609', '#ef4b5f', '#17a2c8', '#8a63d2', '#e9729d', '#6c8a3b', '#9aa5b8'];
  const charts = {};
  Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
  Chart.defaults.color = '#5b6783';
  const oeeColor = (v) => (v >= OEE.target() ? COL.green : v >= 0.6 ? COL.amber : COL.red);
  const p100 = (v) => Math.round((v || 0) * 1000) / 10;

  function mk(id, cfg) {
    if (charts[id]) charts[id].destroy();
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    charts[id] = new Chart(document.getElementById(id), cfg);
  }

  // teks di tengah gauge
  const gaugeText = {
    id: 'gaugeText',
    afterDraw(chart) {
      const o = chart.options.plugins.gaugeText;
      if (!o) return;
      const arc = chart.getDatasetMeta(0).data[0];
      const ctx = chart.ctx;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = o.color;
      ctx.font = '700 32px "Segoe UI", sans-serif';
      ctx.fillText(o.text, arc.x, arc.y - 14);
      ctx.fillStyle = '#7a869f';
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText(o.sub, arc.x, arc.y + 6);
      ctx.restore();
    },
  };

  // selisih terhadap periode pembanding
  function delta(cur, prev, opt) {
    if (prev == null) return '';
    opt = opt || {};
    let diff, txt;
    if (opt.points) { diff = (cur - prev) * 100; txt = (diff >= 0 ? '+' : '') + diff.toFixed(1) + ' poin'; }
    else { if (!prev) return ''; diff = ((cur - prev) / prev) * 100; txt = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%'; }
    if (Math.abs(diff) < 0.05) return '<span class="flat">= sama dgn periode lalu</span>';
    const up = diff > 0;
    const good = opt.inverse ? !up : up;
    return `<span class="${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${txt}</span> <span class="text-muted">vs periode lalu</span>`;
  }

  function setKpi(id, value, html) { $('#' + id).text(value); $('#d' + id.slice(1)).html(html || ''); }

  function render(d) {
    const k = d.kpi, pv = d.prev;
    const hasData = k.total_produksi > 0;

    setKpi('kOee', F.pct(k.oee), delta(k.oee, pv && pv.oee, { points: true }));
    setKpi('kA', F.pct(k.availability), delta(k.availability, pv && pv.availability, { points: true }));
    setKpi('kP', F.pct(k.performance), delta(k.performance, pv && pv.performance, { points: true }));
    setKpi('kQ', F.pct(k.quality), delta(k.quality, pv && pv.quality, { points: true }));
    setKpi('kTotal', F.int(k.total_produksi), delta(k.total_produksi, pv && pv.total_produksi));
    setKpi('kOk', F.int(k.total_ok), delta(k.total_ok, pv && pv.total_ok));
    setKpi('kNg', F.int(k.total_ng) + ' (' + F.pct(k.pct_ng) + ')', delta(k.total_ng, pv && pv.total_ng, { inverse: true }));
    setKpi('kDt', F.dec1(k.downtime_jam), delta(k.downtime_jam, pv && pv.downtime_jam, { inverse: true }));
    $('#kOee').css('color', hasData ? oeeColor(k.oee) : '');

    // progress A/P/Q
    [['A', k.availability], ['P', k.performance], ['Q', k.quality]].forEach(([c, v]) => {
      $('#b' + c).css('width', Math.min(100, v * 100) + '%');
      $('#t' + c).text(F.pct(v));
    });

    // gauge
    const v = Math.min(1, Math.max(0, k.oee));
    mk('cGauge', {
      type: 'doughnut',
      data: { labels: ['OEE', 'Sisa'], datasets: [{ data: [v, 1 - v], backgroundColor: [oeeColor(k.oee), '#e8ecf5'], borderWidth: 0 }] },
      options: {
        rotation: -90, circumference: 180, cutout: '72%',
        plugins: {
          legend: { display: false }, tooltip: { enabled: false },
          gaugeText: { text: F.pct(k.oee), color: oeeColor(k.oee), sub: 'Target ' + Math.round(OEE.target() * 100) + '%' },
        },
      },
      plugins: [gaugeText],
    });

    // tren OEE harian
    const lbl = d.trend.map((r) => F.tgl(r.tanggal));
    const tgt = d.trend.map(() => Math.round(OEE.target() * 100));
    mk('cTrend', {
      type: 'line',
      data: {
        labels: lbl,
        datasets: [
          { label: 'OEE', data: d.trend.map((r) => p100(r.oee)), borderColor: COL.primary, backgroundColor: 'rgba(79,107,237,.12)', fill: true, borderWidth: 3, tension: .3, pointRadius: 3 },
          { label: 'Availability', data: d.trend.map((r) => p100(r.availability)), borderColor: COL.cyan, borderWidth: 1.5, tension: .3, pointRadius: 0 },
          { label: 'Performance', data: d.trend.map((r) => p100(r.performance)), borderColor: COL.purple, borderWidth: 1.5, tension: .3, pointRadius: 0 },
          { label: 'Quality', data: d.trend.map((r) => p100(r.quality)), borderColor: COL.green, borderWidth: 1.5, tension: .3, pointRadius: 0 },
          { label: 'Target', data: tgt, borderColor: COL.red, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: { y: { ticks: { callback: (x) => x + '%' }, suggestedMin: 0 } },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}%` } } },
      },
    });

    // output harian: stacked OK/NG + %NG
    mk('cOutput', {
      data: {
        labels: lbl,
        datasets: [
          { type: 'bar', label: 'OK', data: d.trend.map((r) => r.total_ok), backgroundColor: COL.green, stack: 's', borderRadius: 3 },
          { type: 'bar', label: 'NG', data: d.trend.map((r) => r.total_ng), backgroundColor: COL.red, stack: 's', borderRadius: 3 },
          { type: 'line', label: '% NG', data: d.trend.map((r) => p100(r.pct_ng)), borderColor: COL.amber, backgroundColor: COL.amber, yAxisID: 'y1', tension: .3, pointRadius: 2, borderWidth: 2 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { stacked: true }, y: { stacked: true, ticks: { callback: (x) => F.int(x) } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (x) => x + '%' }, suggestedMin: 0 },
        },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    // shift
    mk('cShift', {
      type: 'pie',
      data: {
        labels: d.shift.map((s) => 'Shift ' + s.shift),
        datasets: [{ data: d.shift.map((s) => s.total), backgroundColor: [COL.primary, COL.cyan, COL.purple], borderWidth: 2, borderColor: '#fff' }],
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (c) => { const s = d.shift[c.dataIndex]; return ` ${F.int(s.total)} pcs · NG ${F.pct(s.pct_ng)}`; } } },
        },
      },
    });

    // OEE per mesin
    const ms = d.mesin;
    mk('cMesin', {
      data: {
        labels: ms.map((m) => 'MC ' + m.no_mesin),
        datasets: [
          { type: 'bar', label: 'OEE', data: ms.map((m) => p100(m.oee)), backgroundColor: ms.map((m) => oeeColor(m.oee)), borderRadius: 4 },
          { type: 'line', label: 'Target', data: ms.map(() => Math.round(OEE.target() * 100)), borderColor: COL.red, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.5 },
        ],
      },
      options: {
        scales: { y: { ticks: { callback: (x) => x + '%' }, suggestedMin: 0 } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}%` } } },
      },
    });

    // top part
    mk('cPart', {
      type: 'bar',
      data: {
        labels: d.top_part.map((p) => p.nama_part),
        datasets: [{ label: 'Output (pcs)', data: d.top_part.map((p) => p.total_produksi), backgroundColor: COL.primary, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        scales: { x: { ticks: { callback: (x) => F.int(x) } } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: (c) => { const p = d.top_part[c.dataIndex]; return `OEE ${F.pct(p.oee)} · NG ${F.pct(p.pct_ng)}`; } } },
        },
      },
    });

    // pareto NG
    const totalNg = d.ng.reduce((s, r) => s + r.qty, 0);
    const top = d.ng.slice(0, 10);
    let cum = 0;
    const cumPct = top.map((r) => { cum += r.qty; return totalNg ? Math.round((cum / totalNg) * 1000) / 10 : 0; });
    mk('cNg', {
      data: {
        labels: top.map((r) => r.nama),
        datasets: [
          { type: 'bar', label: 'Qty NG', data: top.map((r) => r.qty), backgroundColor: COL.red, borderRadius: 4 },
          { type: 'line', label: 'Kumulatif %', data: cumPct, borderColor: COL.primary, backgroundColor: COL.primary, yAxisID: 'y1', tension: .2, pointRadius: 3, borderWidth: 2 },
        ],
      },
      options: {
        scales: {
          x: { ticks: { maxRotation: 55, minRotation: 35 } },
          y: { ticks: { callback: (x) => F.int(x) } },
          y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: (x) => x + '%' } },
        },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    // downtime (top 8 + lainnya)
    let dt = d.downtime.slice(0, 8);
    const rest = d.downtime.slice(8).reduce((s, r) => s + r.jam, 0);
    if (rest > 0) dt = dt.concat([{ nama: 'Lainnya', jam: rest }]);
    mk('cDt', {
      type: 'doughnut',
      data: { labels: dt.map((r) => r.nama), datasets: [{ data: dt.map((r) => r.jam), backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        cutout: '55%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${F.dec1(c.parsed)} jam` } },
        },
      },
    });

    // tabel per mesin
    const $tb = $('#tblMesin tbody').empty();
    ms.forEach((m) => {
      $tb.append(`<tr>
        <td><strong>MC ${m.no_mesin}</strong></td><td>${OEE.esc(m.brand || '-')}</td>
        <td class="text-end">${F.int(m.total_produksi)}</td><td class="text-end">${F.pct(m.pct_ng)}</td>
        <td class="text-end">${F.dec1(m.downtime_jam)}</td>
        <td class="text-end">${F.pct(m.availability)}</td><td class="text-end">${F.pct(m.performance)}</td><td class="text-end">${F.pct(m.quality)}</td>
        <td class="text-end">${OEE.oeeBadge(m.oee)}</td></tr>`);
    });
    if (!ms.length) $tb.append('<tr><td colspan="9" class="text-center text-muted py-4">Tidak ada data untuk filter ini</td></tr>');
  }

  function load() {
    $('#loading').removeClass('d-none');
    $.getJSON('/api/dashboard', OEE.clean(OEE.getFilter()))
      .done(render)
      .fail(OEE.ajaxError)
      .always(() => $('#loading').addClass('d-none'));
  }

  OEE.initFilter(load, 'bulan');
});
