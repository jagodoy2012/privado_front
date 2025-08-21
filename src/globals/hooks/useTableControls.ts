import { useMemo, useState } from 'react';

export function useTableControls<T>(rows: T[], opts?: { pageSize?: number }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(opts?.pageSize ?? 10);

  // para que, al buscar o cambiar pageSize, vuelvas a la página 1
  function updateQuery(q: string) { setQuery(q); setPage(1); }
  function updatePageSize(n: number) { setPageSize(n); setPage(1); }

  return { query, setQuery: updateQuery, page, setPage, pageSize, setPageSize: updatePageSize };
}
