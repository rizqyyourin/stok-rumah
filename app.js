/* ====================== HELPER DOM & UTILS ====================== */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const escHtml = s => String(s??'')
  .replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');


function toast(msg){
  const el = document.createElement('div');
  el.className = 't'; el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),350); }, 2200);
}

const fmtDate = d => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' });
};

function toCsv(rows, headers){
  const esc = (v) => `"${String(v??'').replaceAll('"','""')}"`;
  const head = headers.map(esc).join(',');
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
  return head + '\n' + body;
}
function download(name, text){
  const blob = new Blob([text], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

/* ====================== DIALOGS: ALERT & CONFIRM ====================== */
function showAlert({ title='Info', message='', type='info', okText='OK' } = {}) {
  return new Promise(resolve=>{
    const bd = $('#alertBackdrop'), t=$('#alertTitle'), m=$('#alertMessage'), i=$('#alertIcon'), ok=$('#alertOk');
    const iconChar  = {info:'ℹ️', success:'✅', warning:'⚠️', error:'❗'}[type] || 'ℹ️';
    const iconClass = (type === 'warning') ? 'warn' : (type === 'error') ? 'error' : (type === 'success') ? 'success' : 'info';
    i.className = 'icon ' + iconClass; i.textContent = iconChar;
    t.textContent = title; m.textContent = message; ok.textContent = okText;
    const onKey = (e)=>{ if(e.key==='Escape' || e.key==='Enter'){ cleanup(); } };
    const cleanup = ()=>{ bd.style.display='none'; ok.removeEventListener('click', cleanup); document.removeEventListener('keydown', onKey); resolve(); };
    ok.addEventListener('click', cleanup);
    document.addEventListener('keydown', onKey);
    bd.style.display='grid';
  });
}
function showConfirm({ title='Konfirmasi', message='Lanjut?', type='warning', yesText='Ya', noText='Batal' } = {}) {
  return new Promise(resolve=>{
    const bd=$('#confirmBackdrop'), t=$('#confirmTitle'), m=$('#confirmMessage'), i=$('#confirmIcon'), yes=$('#confirmYes'), no=$('#confirmNo');
    const iconChar  = {warning:'⚠️', danger:'❗', info:'ℹ️'}[type] || '⚠️';
    const iconClass = (type === 'danger') ? 'error' : (type === 'warning') ? 'warn' : 'info';
    i.className = 'icon ' + iconClass; i.textContent = iconChar;
    t.textContent = title; m.textContent = message; yes.textContent = yesText; no.textContent = noText;
    const cleanup = ()=>{ bd.style.display='none'; yes.onclick = no.onclick = null; document.removeEventListener('keydown', onKey); };
    const onKey   = (e)=>{ if(e.key==='Escape'){ cleanup(); resolve(false); } if(e.key==='Enter'){ cleanup(); resolve(true); } };
    yes.onclick = ()=>{ cleanup(); resolve(true); };
    no.onclick  = ()=>{ cleanup(); resolve(false); };
    document.addEventListener('keydown', onKey);
    bd.style.display='grid';
  });
}
const showSuccess = (message)=> showAlert({ title:'Berhasil', message, type:'success' });

/* ====================== BADGES & ICONS ====================== */
function lokasiBadge(l){
  const label = escHtml(l||'-');
  const v = String(l||'').toLowerCase().trim();
  let cls = (v==='lantai 1')?'l1':(v==='lantai 2')?'l2':(v==='lantai 3')?'l3':'other';
  return `<span class="badge ${cls}">${label}</span>`;
}

const CATEGORY_ICONS = {
  'kebersihan': '🧼',
  'mandi': '🧴', 'hygiene': '🧴',
  'laundry': '🧺',
  'kertas': '🧻', 'tisu': '🧻',
  'bahan pokok': '🍚', 'beras': '🍚',
  'bumbu': '🧂', 'minyak': '🧂',
  'instan': '🍜', 'kaleng': '🍜', 'mie': '🍜',
  'snack': '🍪', 'roti': '🍞',
  'minuman': '🥤', 'kopi': '☕', 'teh': '🍵',
  'dapur': '🍽️', 'peralatan': '🍽️',
  'tools': '🧰', 'perbaikan': '🧰',
  'listrik': '💡', 'baterai': '🔋',
  'obat': '💊', 'kesehatan': '💊',
  'bayi': '🍼', 'anak': '🧒',
  'hewan': '🐶',
  'kebun': '🌿', 'tanaman': '🌿'
};

function kategoriIcon(label){
  const lbl = escHtml(String(label||'').trim());
  if (!lbl) return '-';
  const k = lbl.toLowerCase();
  const key = Object.keys(CATEGORY_ICONS).find(kk => k.includes(kk));
  const emoji = key ? CATEGORY_ICONS[key] : '🏷️';
  return `${emoji} ${lbl}`;
}

/* ====================== JSONP HELPER ====================== */
function jsonp(url){
  return new Promise((resolve, reject) => {
    const cb = '__cb' + Date.now() + Math.floor(Math.random()*1e6);
    const s  = document.createElement('script');
    window[cb] = (data) => { resolve(data); delete window[cb]; s.remove(); };
    s.onerror  = () => { reject(new Error('JSONP error')); delete window[cb]; s.remove(); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.body.appendChild(s);
  });
}

/* ====================== STATE & CONFIG ====================== */
let page = 1;
let pageSize = 25;
let total = 0;
let hasMore = false;

// tampilkan kolom ini saja
const DISPLAY_HEADERS = ['nama','kategori','qty','satuan','lokasi'];
const INTERNAL_ID_FIELD = 'id';
const INTERNAL_UPDATED_FIELD = 'updatedAt';

let rows = [];
let sortKey = 'nama';
let sortAsc = true;

// Pakai JSONP untuk GET kalau di static host (GitHub Pages dsb) agar bebas CORS
const FORCE_JSONP = false; // set ke true jika fetch GET diblok CORS

/* ====================== API ====================== */
async function apiList(params = {}){
  const q = new URLSearchParams({
    page: params.page ?? page,
    pageSize: params.pageSize ?? pageSize,
    sort: params.sort ?? sortKey,
    order: (params.order ?? (sortAsc ? 'asc' : 'desc')),
    q: params.q ?? ($('#search')?.value.trim() || '')
  });
  const sel = $('#catFilter');
  if (sel && sel.value && sel.value !== '__ALL__') q.set('cat', sel.value);

  const url = API_URL + (API_URL.includes('?') ? '&' : '?') + q.toString();

  const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
  if (FORCE_JSONP || (isLocal && typeof USE_JSONP_LOCAL !== 'undefined' && USE_JSONP_LOCAL)){
    try { return await jsonp(url); } catch(e){ console.warn('JSONP gagal, fallback fetch', e); }
  }
  const r = await fetch(url);
  return r.json();
}

async function apiMeta(){
  const url = API_URL + (API_URL.includes('?') ? '&' : '?') + 'meta=1';
  const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
  if (FORCE_JSONP || (isLocal && typeof USE_JSONP_LOCAL !== 'undefined' && USE_JSONP_LOCAL)){
    try { return await jsonp(url); } catch(e){ console.warn('JSONP meta gagal, fallback fetch', e); }
  }
  const r = await fetch(url);
  return r.json();
}

async function api(action, payload={}){
  const body = new URLSearchParams({ key:TOKEN, action, ...payload });
  const r = await fetch(API_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });
  return r.json();
}

/* ====================== NORMALISASI DATA ====================== */
function normalizeRows(data){
  if (!Array.isArray(data) || !data.length) return [];
  if (Array.isArray(data[0])) {
    return data.map(r => ({
      id:        r[0], nama: r[1], kategori: r[2], qty: r[3],
      satuan:    r[4], lokasi: r[5], updatedAt: r[6],
    }));
  }
  return data.map(o => {
    const map = {}; Object.keys(o).forEach(k => { map[k.toLowerCase().trim()] = k; });
    return {
      id:        o[ map['id'] ] ?? '',
      nama:      o[ map['nama'] ] ?? '',
      kategori:  o[ map['kategori'] ] ?? '',
      qty:       o[ map['qty'] ] ?? '',
      satuan:    o[ map['satuan'] ] ?? '',
      lokasi:    o[ map['lokasi'] ] ?? '',
      updatedAt: o[ map['updatedat'] ] ?? o[ map['updated_at'] ] ?? '',
    };
  });
}

/* ====================== RENDER ====================== */
function updateSortIndicators(){
  $$('#thead th.sortable').forEach(th=>{
    const k = th.dataset.key;
    th.querySelector('span').textContent = (k===sortKey) ? (sortAsc?'▲':'▼') : '';
  });
}

function renderHeader(){
  const ths = DISPLAY_HEADERS.map(h => `<th class="sortable" data-key="${h}">${h}<span></span></th>`).join('');
  $('#thead').innerHTML = ths + `<th>Aksi</th>`;
  $$('#thead th.sortable').forEach(th=>{
    th.onclick = ()=>{
      const key = th.dataset.key;
      if (sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; }
      load(1); // minta ulang ke server
    };
  });
  updateSortIndicators();
}

function renderBody(){

    

  if (!rows.length){
    $('#tbody').innerHTML = `<tr><td class="empty" colspan="99">Tidak ada data</td></tr>`;
    return;
  }
  $('#tbody').innerHTML = rows.map(o=>{
    const cells = DISPLAY_HEADERS.map(h => {
      let val = o[h] ?? '';
      if (h === 'lokasi')   val = lokasiBadge(val);
      else if (h === 'kategori') val = kategoriIcon(val);
      else val = escHtml(val);

      return `<td>${val}</td>`;
    }).join('');
    const id = o[INTERNAL_ID_FIELD];
    return `<tr data-id="${id}">
      ${cells}
      <td class="actions">
        <button class="btn" data-act="edit" data-id="${id}">Edit</button>
        <button class="btn danger" data-act="delete" data-id="${id}">Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

function renderPager(){
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end   = Math.min(page * pageSize, total);

  const infoCatSel = $('#catFilter');
  const infoCat = infoCatSel && infoCatSel.value && infoCatSel.value !== '__ALL__'
    ? ` • Kategori: ${infoCatSel.value}` : '';

  $('#pagerInfo').textContent = `Menampilkan ${start}–${end} dari ${total}${infoCat}`;

  const prevBtn = $('#prevPage');
  const nextBtn = $('#nextPage');
  const pagerBar = $('#pagerBar');

  const isFirst = (page <= 1);
  const isLast  = !hasMore || (page * pageSize >= total);

  // sembunyikan tombol di boundary
  prevBtn.hidden = isFirst;
  nextBtn.hidden = isLast;

  // tetap set disabled juga (good practice)
  prevBtn.disabled = isFirst;
  nextBtn.disabled = isLast;

  // kalau cuma 1 halaman / tidak ada data, sembunyikan seluruh pager bar (opsional)
  const onlyOnePage = total === 0 || total <= pageSize;
  pagerBar.style.display = onlyOnePage ? 'none' : 'flex';
}

/* ====================== LOAD ====================== */
async function load(p = page){
  $('#reloading').style.display='inline-block';
  try{
    const res = await apiList({ page: p, pageSize, sort: sortKey, order: sortAsc ? 'asc' : 'desc' });
    const { ok, data, error, total:tot, page:pg, pageSize:ps, hasMore:hm } = res || {};
    if (!ok) throw new Error(error || 'Load gagal');

    rows = normalizeRows(Array.isArray(data) ? data : []);
    total = Number(tot || 0);
    page  = Number(pg || 1);
    pageSize = Number(ps || pageSize);
    hasMore  = !!hm;

    renderHeader();
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

/* ====================== EVENTS ====================== */
// Search (debounce → server)
let tSearch;
$('#search')?.addEventListener('input', ()=>{
  clearTimeout(tSearch);
  tSearch = setTimeout(()=> load(1), 300);
});

// Pager
$('#pageSize')?.addEventListener('change', ()=>{
  pageSize = Number($('#pageSize').value) || 25;
  load(1);
});
$('#prevPage')?.addEventListener('click', ()=>{ if (page>1) load(page-1); });
$('#nextPage')?.addEventListener('click', ()=>{ if (hasMore) load(page+1); });

// Reload
$('#reload')?.addEventListener('click', ()=> load(page));

// Export CSV (current page)
$('#exportCsv')?.addEventListener('click', ()=>{
  if (!rows.length) return toast('Tidak ada data untuk diekspor');
  download('stok-keluarga.csv', toCsv(rows, DISPLAY_HEADERS));
});

// Create (modal)
$('#openCreate')?.addEventListener('click', ()=>{
  const f = $('#createForm');
  f.reset();
  $('#createBackdrop').style.display = 'grid';
  document.body.classList.add('modal-open');
});
$('#closeCreate')?.addEventListener('click', ()=>{
  $('#createBackdrop').style.display = 'none';
  document.body.classList.remove('modal-open');
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

// Edit / Delete
$('#tbody')?.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button'); if (!btn) return;
  const id = btn.dataset.id;
  const row = rows.find(r => String(r[INTERNAL_ID_FIELD]) === String(id));
  if (!row) { await showAlert({ title:'Tidak ditemukan', message:'Item tidak ditemukan.', type:'warning' }); return; }

  if (btn.dataset.act === 'delete'){
    const ok = await showConfirm({ title:'Hapus Item', message:`Yakin hapus "${row.nama}"?`, type:'danger', yesText:'Hapus', noText:'Batal' });
    if (!ok) return;
    const r = await api('delete', { id });
    if (!r.ok) { await showAlert({ title:'Gagal hapus', message:(r.error||'Terjadi kesalahan'), type:'error' }); return; }
    await showSuccess(`Item "${row.nama}" telah dihapus.`);
    load(page);
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
    document.body.classList.add('modal-open');   // << tambahkan baris ini

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
  document.body.classList.remove('modal-open'); // << tambahkan baris ini
  await showSuccess('Perubahan disimpan.');
  load(page);
});

/* ====================== KATEGORI FILTER ====================== */
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

/* ====================== FIRST LOAD ====================== */
(async ()=>{
  await initCategoryFilter();
  load(1);
})();
