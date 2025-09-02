// utils.js
export const $  = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const escHtml = s => String(s??'')
  .replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

export function toast(msg){
  const el = document.createElement('div');
  el.className = 't'; el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),350); }, 2200);
}

export const fmtDate = d => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' });
};

export function toCsv(rows, headers){
  const esc = (v) => `"${String(v??'').replaceAll('"','""')}"`;
  const head = headers.map(esc).join(',');
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
  return head + '\n' + body;
}

export function download(name, text){
  const blob = new Blob([text], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

// JSONP untuk GET (lewati CORS saat dev / pages)
export function jsonp(url){
  return new Promise((resolve, reject) => {
    const cb = '__cb' + Date.now() + Math.floor(Math.random()*1e6);
    const s  = document.createElement('script');
    window[cb] = (data) => { resolve(data); delete window[cb]; s.remove(); };
    s.onerror  = () => { reject(new Error('JSONP error')); delete window[cb]; s.remove(); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.body.appendChild(s);
  });
}

// Normalisasi respons data jadi array of objects {id,nama,kategori,qty,satuan,lokasi,updatedAt}
export function normalizeRows(data){
  if (!Array.isArray(data) || !data.length) return [];
  if (Array.isArray(data[0])) {
    return data.map(r => ({
      id: r[0], nama: r[1], kategori: r[2], qty: r[3],
      satuan: r[4], lokasi: r[5], updatedAt: r[6],
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
