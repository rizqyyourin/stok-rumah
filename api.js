// api.js
import { API_URL, TOKEN, USE_JSONP_LOCAL, FORCE_JSONP } from './config.js';
import { jsonp, $ } from './utils.js';

export async function apiList(params = {}){
  const page     = params.page;
  const pageSize = params.pageSize;
  const sort     = params.sort;
  const order    = params.order;
  const qVal     = params.q ?? ($('#search')?.value.trim() || '');

  const qs = new URLSearchParams({ page, pageSize, sort, order, q: qVal });
  const sel = $('#catFilter');
  if (sel && sel.value && sel.value !== '__ALL__') qs.set('cat', sel.value);

  const url = API_URL + (API_URL.includes('?') ? '&' : '?') + qs.toString();

  const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
  if (FORCE_JSONP || (isLocal && USE_JSONP_LOCAL)){
    try { return await jsonp(url); } catch(e){ /* fallback */ }
  }
  const r = await fetch(url);
  return r.json();
}

export async function apiMeta(){
  const url = API_URL + (API_URL.includes('?') ? '&' : '?') + 'meta=1';
  const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
  if (FORCE_JSONP || (isLocal && USE_JSONP_LOCAL)){
    try { return await jsonp(url); } catch(e){ /* fallback */ }
  }
  const r = await fetch(url);
  return r.json();
}

export async function api(action, payload = {}){
  const body = new URLSearchParams({ key:TOKEN, action, ...payload });
  const r = await fetch(API_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });
  return r.json();
}
