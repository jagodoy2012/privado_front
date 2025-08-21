type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
  pageSizeOptions?: number[];
};

export default function Paginator({
  page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50],
}: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="paginator">
      <div className="paginator-info">{start}–{end} de {total}</div>

      {onPageSizeChange && (
        <select
          className="paginator-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map(n => <option key={n} value={n}>{n}/pág</option>)}
        </select>
      )}

      <div className="paginator-nav">
        <button className="btn" disabled={page <= 1} onClick={() => onPageChange(1)} title="Primera">«</button>
        <button className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} title="Anterior">‹</button>
        <span className="paginator-page">{page} / {pages}</span>
        <button className="btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)} title="Siguiente">›</button>
        <button className="btn" disabled={page >= pages} onClick={() => onPageChange(pages)} title="Última">»</button>
      </div>
    </div>
  );
}
