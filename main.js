// main.js
import { $, $$, download, toCsv, normalizeRows } from './utils.js';
import { showAlert, showConfirm, showSuccess } from './dialogs.js';
import { apiList, apiMeta, api } from './api.js';
import { state, DISPLAY_HEADERS, INTERNAL_ID_FIELD } from './state.js';
import { renderHeader, renderBody, renderPager } from './render.js';

/* ============== LOAD (fetch + state + render) ============== */
async function load(p = state.page){
  $('#reloading').style.display='inline-block';
  try{
    const res = await apiList({
      page: p, pageSize: state.pageSize, sort: state.sortKey, order: state.sortAsc ? 'asc' : 'desc'
    });
    const { ok, data, error, total:tot, page:pg, pageSize:ps, hasMore:hm } = res || {};
    if (!ok) throw new Error(error || 'Load gagal');

    state.rows = normalizeRows(Array.isArray(data) ? data : []);
    state.total = Number(tot || 0);
    state.page  = Number(pg || 1);
    state.pageSize = Number(ps || state.pageSize);
    state.hasMore  = !!hm;

    renderHeader(()=> load(1));
    renderBody();
    renderPager();
  } catch (e) {
    console.error(e);
    $('#tbody').innerHTML = `<tr><td class="empty" colspan="99">Gagal memuat data. Cek API_URL/TOKEN & Apps Script Executions.</td></tr>`;
    await showAlert({ title:'Gagal memuat', message:'Cek API_URL/TOKEN & Apps Script → Executions.', type:'error' });
  } finally {
    $('#reloading').style.display='none';
  }
}

/* ============== KATEGORI FILTER INIT ============== */
async function initCategoryFilter(){
  try{
    const res = await apiMeta();
    const cats = res?.meta?.categories || [];
    const sel = $('#catFilter');
    if (!sel) return;
    sel.innerHTML = `<option value="__ALL__">Semua kategori</option>` + cats.map(c => `<option>${c}</option>`).join('');
    sel.addEventListener('change', ()=> load(1));
  }catch(e){
    console.warn('Gagal ambil kategori:', e);
  }
}

/* ============== EVENTS ============== */
// Search (debounce → server)
let tSearch;
$('#search')?.addEventListener('input', ()=>{
  clearTimeout(tSearch);
  tSearch = setTimeout(()=> load(1), 300);
});

// Pager
$('#pageSize')?.addEventListener('change', ()=>{
  state.pageSize = Number($('#pageSize').value) || 25;
  load(1);
});
$('#prevPage')?.addEventListener('click', ()=>{ if (state.page>1) load(state.page-1); });
$('#nextPage')?.addEventListener('click', ()=>{ if (state.hasMore) load(state.page+1); });

// Reload
$('#reload')?.addEventListener('click', ()=> load(state.page));

// Export CSV (current page)
$('#exportCsv')?.addEventListener('click', ()=>{
  if (!state.rows.length) return alert('Tidak ada data untuk diekspor');
  download('stok-keluarga.csv', toCsv(state.rows, DISPLAY_HEADERS));
});

// Create (modal)
$('#openCreate')?.addEventListener('click', ()=>{
  const f = $('#createForm');
  f.reset();
  $('#createBackdrop').style.display = 'grid';
});
$('#closeCreate')?.addEventListener('click', ()=>{
  $('#createBackdrop').style.display = 'none';
});
$('#saveCreate')?.addEventListener('click', async ()=>{
  const f = $('#createForm');
  if (!f.reportValidity()) return;
  const fd = new FormData(f);
  const payload = Object.fromEntries(fd.entries());
  try{
    const r = await api('create', payload);
    if (!r.ok) throw new Error(r.error || 'Gagal menambah');
    $('#createBackdrop').style.display = 'none';
    await showSuccess('Item berhasil ditambahkan.');
    await load(1);
  }catch(err){
    await showAlert({ title:'Gagal menambah', message: err.message, type:'error' });
  }
});

// Edit / Delete via table
$('#tbody')?.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button'); if (!btn) return;
  const id = btn.dataset.id;
  const row = state.rows.find(r => String(r[INTERNAL_ID_FIELD]) === String(id));
  if (!row) { await showAlert({ title:'Tidak ditemukan', message:'Item tidak ditemukan.', type:'warning' }); return; }

  if (btn.dataset.act === 'delete'){
    const ok = await showConfirm({ title:'Hapus Item', message:`Yakin hapus "${row.nama}"?`, type:'danger', yesText:'Hapus', noText:'Batal' });
    if (!ok) return;
    const r = await api('delete', { id });
    if (!r.ok) { await showAlert({ title:'Gagal hapus', message:(r.error||'Terjadi kesalahan'), type:'error' }); return; }
    await showSuccess(`Item "${row.nama}" telah dihapus.`);
    load(state.page);
  }

  if (btn.dataset.act === 'edit'){
    const f = $('#editForm');
    f.nama.value     = row.nama ?? '';
    f.kategori.value = row.kategori ?? '';
    f.qty.value      = row.qty ?? '';
    f.satuan.value   = row.satuan ?? '';

    const lokasiEdit = $('#lokasiEdit');
    const val = row.lokasi ?? '';
    if (val && ![...lokasiEdit.options].some(o => o.value === val)) {
      lokasiEdit.insertAdjacentHTML('beforeend', `<option>${val}</option>`);
    }
    lokasiEdit.value = val;

    f.id.value       = row[INTERNAL_ID_FIELD];
    $('#modalBackdrop').style.display='grid';
  }
});

$('#closeModal')?.addEventListener('click', ()=> $('#modalBackdrop').style.display='none');
$('#saveEdit')?.addEventListener('click', async ()=>{
  const f = $('#editForm');
  const payload = {
    id: f.id.value,
    nama: f.nama.value,
    kategori: f.kategori.value,
    qty: f.qty.value,
    satuan: f.satuan.value,
    lokasi: f.lokasi.value
  };
  const r = await api('update', payload);
  if (!r.ok) { await showAlert({ title:'Gagal update', message:(r.error||'Terjadi kesalahan'), type:'error' }); return; }
  $('#modalBackdrop').style.display='none';
  await showSuccess('Perubahan disimpan.');
  load(state.page);
});

/* ============== BOOTSTRAP ============== */
(async ()=>{
  await initCategoryFilter();
  load(1);
})();
