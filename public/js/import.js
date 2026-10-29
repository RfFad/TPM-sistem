$(function () {
  const F = OEE.fmt;
  let token = null;
  let file = null;

  // dropdown bulan
  OEE.BULAN.forEach((b, i) => $('#selBulan').append(`<option value="${i + 1}">${b}</option>`));
  const now = new Date();
  $('#selBulan').val(now.getMonth() + 1);
  $('#inTahun').val(now.getFullYear());

  function pickFile(f) {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) return OEE.toast('Hanya file .xlsx yang didukung', 'warning');
    file = f;
    token = null;
    $('#dropTitle').text(f.name);
    $('#btnPreview').prop('disabled', false);
    $('#previewCard').addClass('d-none');
  }

  $('#fileInput').on('change', function () { pickFile(this.files[0]); });
  $('#dropZone')
    .on('dragover dragenter', function (e) { e.preventDefault(); $(this).addClass('drag'); })
    .on('dragleave drop', function (e) { e.preventDefault(); $(this).removeClass('drag'); })
    .on('drop', function (e) { pickFile(e.originalEvent.dataTransfer.files[0]); });

  $('#btnPreview').on('click', function () {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const $btn = $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Membaca file...');
    $.ajax({ url: '/api/import/preview', method: 'POST', data: fd, processData: false, contentType: false })
      .done(showPreview)
      .fail(OEE.ajaxError)
      .always(() => $btn.prop('disabled', false).html('<i class="bi bi-search"></i> Periksa File'));
  });

  function stat(l, v) { return `<div class="col-6 col-md-4"><div class="stat-box"><div class="l">${l}</div><div class="v">${v}</div></div></div>`; }

  function showPreview(res) {
    token = res.token;
    const s = res.ringkasan;
    $('#previewStats').html(
      stat('Baris valid', F.int(s.totalBaris)) +
      stat('Tanggal', `${s.hariMin} – ${s.hariMax}`) +
      stat('Mesin · Part', `${s.jumlahMesin} · ${s.jumlahPart}`) +
      stat('Total produksi', F.int(s.totalProduksi)) +
      stat('Total NG', F.int(s.totalNg)) +
      stat('OEE (perkiraan)', OEE.oeeBadge(s.oee))
    );
    const $tb = $('#tblSample tbody').empty();
    res.sample.forEach((r) => $tb.append(`<tr><td>${r.baris}</td><td>${r.hari}</td><td>MC ${r.mesin}</td><td>${OEE.esc(r.part)}</td>
      <td class="text-end">${F.int(r.ok)}</td><td class="text-end">${F.int(r.ng)}</td><td class="text-end">${F.dec1(r.jam_plan)}</td><td class="text-end">${F.dec1(r.downtime)}</td></tr>`));

    if (res.deteksi.bulan) $('#selBulan').val(res.deteksi.bulan);
    if (res.deteksi.tahun) $('#inTahun').val(res.deteksi.tahun);

    if (res.warning_count) {
      $('#warnBox').removeClass('d-none');
      $('#warnTitle').text(`${res.warning_count} catatan pada file (periksa sebelum menyimpan)`);
      const items = res.warnings.slice(0, 100).map((w) => `<li>${w.baris ? 'Baris ' + w.baris + ': ' : ''}${OEE.esc(w.pesan)}</li>`).join('');
      $('#warnItems').html(items + (res.warning_count > 100 ? `<li>... dan ${res.warning_count - 100} lainnya</li>` : ''));
    } else {
      $('#warnBox').addClass('d-none');
    }
    $('#previewCard').removeClass('d-none');
    $('html, body').animate({ scrollTop: $('#previewCard').offset().top - 80 }, 250);
  }

  $('#btnCommit').on('click', function () {
    if (!token) return;
    const bulan = +$('#selBulan').val(), tahun = +$('#inTahun').val(), mode = $('#selMode').val();
    const msg = mode === 'timpa'
      ? `Data ${OEE.BULAN[bulan - 1]} ${tahun} yang sudah ada di database akan DIGANTI dengan isi file ini. Lanjutkan?`
      : `Isi file akan ditambahkan ke data ${OEE.BULAN[bulan - 1]} ${tahun} (bisa menyebabkan data ganda bila sudah pernah diimpor). Lanjutkan?`;
    if (!confirm(msg)) return;

    const $btn = $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Menyimpan...');
    $.ajax({ url: '/api/import/commit', method: 'POST', contentType: 'application/json', data: JSON.stringify({ token, bulan, tahun, mode }) })
      .done((res) => {
        let t = `${F.int(res.diimpor)} baris berhasil diimpor`;
        if (res.dihapus) t += `, ${F.int(res.dihapus)} baris lama diganti`;
        if (res.dilewati) t += `, ${res.dilewati} baris dilewati (tanggal di luar bulan)`;
        OEE.toast(t);
        token = null; file = null;
        $('#previewCard').addClass('d-none');
        $('#dropTitle').text('Klik atau seret file .xlsx ke sini');
        $('#fileInput').val('');
        $('#btnPreview').prop('disabled', true);
        sessionStorage.removeItem('oeeFilter');
        loadHistory();
      })
      .fail(OEE.ajaxError)
      .always(() => $btn.prop('disabled', false).html('<i class="bi bi-database-check"></i> Simpan ke Database'));
  });

  function loadHistory() {
    $.getJSON('/api/import/history').done((res) => {
      const $tb = $('#tblHistory tbody').empty();
      res.rows.forEach((r) => $tb.append(`<tr>
        <td><div class="text-truncate" style="max-width:170px" title="${OEE.esc(r.nama_file)}">${OEE.esc(r.nama_file)}</div>
            <div class="text-muted" style="font-size:.7rem">${OEE.esc(r.created_at)}</div></td>
        <td class="text-nowrap">${OEE.BULAN_S[r.bulan - 1]} ${r.tahun}<div class="text-muted" style="font-size:.7rem">${r.mode}</div></td>
        <td class="text-end">${F.int(r.baris_aktif)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger btn-del-batch" data-id="${r.id}" title="Hapus impor ini"><i class="bi bi-trash"></i></button></td></tr>`));
      if (!res.rows.length) $tb.append('<tr><td colspan="4" class="text-center text-muted py-4">Belum ada riwayat</td></tr>');
    }).fail(OEE.ajaxError);
  }

  $('#tblHistory').on('click', '.btn-del-batch', function () {
    if (!confirm('Hapus impor ini beserta SEMUA baris produksi yang berasal darinya?')) return;
    $.ajax({ url: '/api/import/' + $(this).data('id'), method: 'DELETE' })
      .done(() => { OEE.toast('Impor dihapus'); sessionStorage.removeItem('oeeFilter'); loadHistory(); })
      .fail(OEE.ajaxError);
  });

  loadHistory();
});
