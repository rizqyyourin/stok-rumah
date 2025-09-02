// dialogs.js
import { $ } from './utils.js';

export function showAlert({ title='Info', message='', type='info', okText='OK' } = {}) {
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

export function showConfirm({ title='Konfirmasi', message='Lanjut?', type='warning', yesText='Ya', noText='Batal' } = {}) {
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

export const showSuccess = (message)=> showAlert({ title:'Berhasil', message, type:'success' });
