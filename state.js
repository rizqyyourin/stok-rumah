// state.js
export const DISPLAY_HEADERS = ['nama','kategori','qty','satuan','lokasi'];
export const INTERNAL_ID_FIELD = 'id';
export const INTERNAL_UPDATED_FIELD = 'updatedAt';

export const state = {
  rows: [],
  page: 1,
  pageSize: 25,
  total: 0,
  hasMore: false,
  sortKey: 'nama',
  sortAsc: true
};
