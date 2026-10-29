$(function () {
  const F = OEE.fmt;
  let page = 1, pages = 1;
  const limit = 25;
  let timer = null;

  function load() {
    const q = Object.assign({ page, limit, q: $('#fSearch').val().trim() }, OEE.clean(OEE.getFilter()));
    $.getJSON('/api/data', q).done((res) => {
      pages = Math.max(1, Math.ceil(res.total / res.limit));
      const $tb = $('#tblData tbody').empty();
      res.rows.forEach((r) => {
        $tb.append(`<tr>
          <td class="text-nowrap">${F.tglFull(r.tanggal)}</td><td>MC ${r.no_mesin}</td>
          <td>${OEE.esc(r.nama_part)}</td><td>${OEE.esc(r.customer || '-')}</td>
          <td class="text-end">${F.int(r.total_ok)}</td><td class="text-end">${F.int(r.total_ng)}</td><td class="text-end">${F.int(r.total_produksi)}</td>
          <td class="text-end">${F.dec1(r.jam_plan)}</td><td class="text-end">${F.dec1(r.downtime_jam)}</td>
          <td class="text-end">${F.pct(r.availability)}</td><td class="text-end">${F.pct(r.performance)}</td><td class="text-end">${F.pct(r.quality)}</td>
          <td class="text-end">${OEE.oeeBadge(r.oee)}</td>
          <td class="text-nowrap text-end">
            <button class="btn btn-sm btn-outline-primary btn-detail" data-id="${r.id}" title="Detail"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-del" data-id="${r.id}" title="Hapus"><i class="bi bi-trash"></i></button>
          </td></tr>`);
      });
      if (!res.rows.length) $tb.append('<tr><td colspan="14" class="text-center text-muted py-4">Tidak ada data</td></tr>');
      const from = res.total ? (res.page - 1) * res.limit + 1 : 0;
      const to = Math.min(res.total, res.page * res.limit);
      $('#pageInfo').text(`${F.int(from)}–${F.int(to)} dari ${F.int(res.total)} baris`);
      $('#btnPrev').prop('disabled', page <= 1);
      $('#btnNext').prop('disabled', page >= pages);
    }).fail(OEE.ajaxError);
  }

  $('#btnPrev').on('click', () => { if (page > 1) { page--; load(); } });
  $('#btnNext').on('click', () => { if (page < pages) { page++; load(); } });
  $('#fSearch').on('input', () => { clearTimeout(timer); timer = setTimeout(() => { page = 1; load(); }, 350); });

  $('#tblData').on('click', '.btn-del', function () {
    if (!confirm('Hapus baris produksi ini? Tindakan ini tidak bisa dibatalkan.')) return;
    $.ajax({ url: '/api/data/' + $(this).data('id'), method: 'DELETE' })
      .done(() => { OEE.toast('Data dihapus'); load(); })
      .fail(OEE.ajaxError);
  });

  $('#tblData').on('click', '.btn-detail', function () {
    $.getJSON('/api/data/' + $(this).data('id')).done((res) => {
      const r = res.row;
      const shiftRows = [1, 2, 3].map((i) => `<tr><td>Shift ${i}</td><td>${OEE.esc(r['operator_s' + i] || '-')}</td><td>${OEE.esc(r['pic_s' + i] || '-')}</td>
        <td class="text-end">${F.int(r['ok_s' + i])}</td><td class="text-end">${F.int(r['ng_s' + i])}</td><td>${OEE.esc(r['ket_s' + i] || '')}</td></tr>`).join('');
      const dt = res.downtime.map((d) => `<li>${OEE.esc(d.nama)}: <strong>${F.dec1(d.jam)} jam</strong>${d.masuk_oee ? '' : ' <span class="text-muted">(tidak masuk OEE)</span>'}</li>`).join('') || '<li class="text-muted">Tidak ada</li>';
      const ng = res.ng.map((d) => `<li>${OEE.esc(d.nama)}: <strong>${F.int(d.qty)}</strong></li>`).join('') || '<li class="text-muted">Tidak ada</li>';
      $('#detailBody').html(`
        <div class="mb-3"><div class="fw-bold fs-5">${OEE.esc(r.nama_part)}</div>
          <div class="text-muted small">${F.tglFull(r.tanggal)} · MC ${r.no_mesin}${r.brand ? ' · ' + OEE.esc(r.brand) : ''} · ${OEE.esc(r.customer || '-')} · Material: ${OEE.esc(r.material || '-')}</div></div>
        <div class="row g-2 mb-3">
          <div class="col-6 col-md-3"><div class="stat-box"><div class="l">Total</div><div class="v">${F.int(r.total_produksi)}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="l">Target</div><div class="v">${F.int(r.target_qty)}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="l">CT std · Cavity</div><div class="v">${r.ct_std}s · ${r.cavity}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="l">Plan · Downtime</div><div class="v">${F.dec1(r.jam_plan)} · ${F.dec1(r.downtime_jam)} jam</div></div></div>
        </div>
        <div class="table-responsive mb-3"><table class="table table-sm small mb-0"><thead><tr><th></th><th>Operator</th><th>PIC</th><th class="text-end">OK</th><th class="text-end">NG</th><th>Keterangan</th></tr></thead><tbody>${shiftRows}</tbody></table></div>
        <div class="row"><div class="col-md-6"><div class="fw-semibold mb-1">Downtime</div><ul class="small">${dt}</ul></div>
        <div class="col-md-6"><div class="fw-semibold mb-1">NG per jenis</div><ul class="small">${ng}</ul></div></div>`);
      new bootstrap.Modal('#detailModal').show();
    }).fail(OEE.ajaxError);
  });

  OEE.initFilter(() => { page = 1; load(); }, 'bulan');
});
