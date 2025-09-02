// badges.js
import { escHtml } from './utils.js';

export const CATEGORY_ICONS = {
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

export function kategoriIcon(label){
  const lbl = escHtml(String(label||'').trim());
  if (!lbl) return '-';
  const k = lbl.toLowerCase();
  const key = Object.keys(CATEGORY_ICONS).find(kk => k.includes(kk));
  const emoji = key ? CATEGORY_ICONS[key] : '🏷️';
  return `${emoji} ${lbl}`;
}

export function lokasiBadge(l){
  const label = escHtml(l||'-');
  const v = String(l||'').toLowerCase().trim();
  let cls = (v==='lantai 1')?'l1':(v==='lantai 2')?'l2':(v==='lantai 3')?'l3':'other';
  return `<span class="badge ${cls}">${label}</span>`;
}
