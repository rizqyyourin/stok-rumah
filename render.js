// render.js
import { $, $$, escHtml } from './utils.js';
import { lokasiBadge, kategoriIcon } from './badges.js';
import { state, DISPLAY_HEADERS, INTERNAL_ID_FIELD } from './state.js';

function updateSortIndicators(){
  $$('#thead th.sortable').forEach(th=>{
    const k = th.dataset.key;
    th.querySelector('span').textContent = (k===state.sortKey) ? (state.sortAsc?'▲':'▼') : '';
  });
}

export function renderHeader(onSort){
  const ths = DISPLAY_HEADERS
    .map(h => `<th class="sortable" data-key="${h}">${h}<span></span></th>`)
    .join('');
  $('#thead').innerHTML = ths + `<th>Aksi</th>`;
  $$('#thead th.sortable').forEach(th=>{
    th.onclick = ()=>{
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortAsc = !state.sortAsc;
      else { state.sortKey = key; state.sortAsc = true; }
      onSort?.();
    };
  });
  updateSortIndicators();
}

export function renderBody(){
  if (!state.rows.length){
    $('#tbody').innerHTML = `<tr><td class="empty" colspan="99">Tidak ada data</td></tr>`;
    return;
  }
  $('#tbody').innerHTML = state.rows.map(o=>{
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

export function renderPager(){
  const start = state.total ? (state.page - 1) * state.pageSize + 1 : 0;
  const end   = Math.min(state.page * state.pageSize, state.total);

  const infoCatSel = $('#catFilter');
  const infoCat = infoCatSel && infoCatSel.value && infoCatSel.value !== '__ALL__'
    ? ` • Kategori: ${infoCatSel.value}` : '';

  $('#pagerInfo').textContent = `Menampilkan ${start}–${end} dari ${state.total}${infoCat}`;

  const prevBtn = $('#prevPage');
  const nextBtn = $('#nextPage');
  const pagerBar = $('#pagerBar');

  const isFirst = (state.page <= 1);
  const isLast  = !state.hasMore || (state.page * state.pageSize >= state.total);

  prevBtn.hidden = isFirst;
  nextBtn.hidden = isLast;
  prevBtn.disabled = isFirst;
  nextBtn.disabled = isLast;

  const onlyOnePage = state.total === 0 || state.total <= state.pageSize;
  pagerBar.style.display = onlyOnePage ? 'none' : 'flex';
}
