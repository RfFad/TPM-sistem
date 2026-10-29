/* Helper bersama: format angka, filter global (tersimpan di sessionStorage), toast */
window.OEE = (function ($) {
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BULAN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const nf0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const target = () => (window.APP && window.APP.oeeTarget) || 0.85;

  const fmt = {
    int: (v) => nf0.format(Number(v) || 0),
    dec1: (v) => nf1.format(Number(v) || 0),
    pct: (v) => nf1.format((Number(v) || 0) * 100) + '%',
    tgl: (s) => { if (!s) return ''; const p = s.split('-'); return `${p[2]} ${BULAN_S[+p[1] - 1]}`; },
    tglFull: (s) => { if (!s) return ''; const p = s.split('-'); return `${p[2]} ${BULAN_S[+p[1] - 1]} ${p[0]}`; },
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function oeeClass(v) { return v >= target() ? 'oee-good' : v >= 0.6 ? 'oee-mid' : 'oee-bad'; }
  function oeeBadge(v) { return `<span class="badge-oee ${oeeClass(v)}">${fmt.pct(v)}</span>`; }

  function toast(msg, type) {
    const id = 't' + Date.now();
    $('#toasts').append(
      `<div id="${id}" class="toast align-items-center text-bg-${type || 'success'} border-0" role="alert">
         <div class="d-flex"><div class="toast-body">${esc(msg)}</div>
         <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`);
    const el = document.getElementById(id);
    new bootstrap.Toast(el, { delay: 4500 }).show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  function ajaxError(xhr) {
    const m = (xhr.responseJSON && xhr.responseJSON.message) || 'Gagal menghubungi server';
    toast(m, 'danger');
  }

  // ---------- filter global ----------
  const KEY = 'oeeFilter';
  let opts = null;

  function getFilter() {
    return {
      dari: $('#fDari').val(), sampai: $('#fSampai').val(),
      mesin: $('#fMesin').val(), customer: $('#fCustomer').val(), produk: $('#fProduk').val(),
    };
  }
  function clean(o) { const r = {}; Object.keys(o).forEach((k) => { if (o[k] !== '' && o[k] != null) r[k] = o[k]; }); return r; }

  function setFilter(f) {
    $('#fDari').val(f.dari || ''); $('#fSampai').val(f.sampai || '');
    $('#fMesin').val(f.mesin || ''); $('#fCustomer').val(f.customer || ''); $('#fProduk').val(f.produk || '');
  }

  function preset(name) {
    if (!opts || !opts.max_tgl) return;
    const [y, m] = opts.max_tgl.split('-').map(Number);
    const p2 = (x) => String(x).padStart(2, '0');
    let dari = '', sampai = opts.max_tgl;
    if (name === 'bulan') { dari = `${y}-${p2(m)}-01`; sampai = `${y}-${p2(m)}-${p2(new Date(Date.UTC(y, m, 0)).getUTCDate())}`; }
    else if (name === 'tahun') { dari = `${y}-01-01`; sampai = `${y}-12-31`; }
    else if (name === '30') { const d = new Date(Date.parse(opts.max_tgl + 'T00:00:00Z') - 29 * 86400000); dari = d.toISOString().slice(0, 10); }
    else if (name === 'semua') { dari = opts.min_tgl; }
    $('#fDari').val(dari); $('#fSampai').val(sampai);
  }

  /** defaultPreset: 'bulan' | 'tahun' | 'semua' */
  function initFilter(onApply, defaultPreset) {
    return $.getJSON('/api/filter-options').done((res) => {
      opts = res;
      if (!res.total) { $('#emptyState').removeClass('d-none'); $('#pageContent').addClass('d-none'); $('.filter-card').addClass('d-none'); return; }
      res.mesin.forEach((m) => $('#fMesin').append(`<option value="${m.id}">Mesin ${m.no_mesin}${m.brand ? ' · ' + esc(m.brand) : ''}</option>`));
      res.customer.forEach((c) => $('#fCustomer').append(`<option value="${esc(c)}">${esc(c)}</option>`));
      res.produk.forEach((p) => $('#fProduk').append(`<option value="${p.id}">${esc(p.nama_part)}</option>`));

      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
      if (saved && saved.dari) setFilter(saved); else preset(defaultPreset || 'bulan');

      const apply = () => { sessionStorage.setItem(KEY, JSON.stringify(getFilter())); onApply(); };
      $('#btnApply').on('click', apply);
      $('.preset').on('click', function (e) { e.preventDefault(); preset($(this).data('preset')); apply(); });
      $('#btnReset').on('click', function (e) { e.preventDefault(); setFilter({}); preset(defaultPreset || 'bulan'); apply(); });
      $('#fDari, #fSampai, #fMesin, #fCustomer, #fProduk').on('keydown', (e) => { if (e.key === 'Enter') apply(); });
      onApply();
    }).fail(ajaxError);
  }

  $(document).on('click', '#btnSidebar', () => $('#sidebar').toggleClass('open'));

  return { BULAN, BULAN_S, fmt, esc, target, oeeClass, oeeBadge, toast, ajaxError, getFilter, clean, initFilter, get opts() { return opts; } };
})(jQuery);
