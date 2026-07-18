interface PaginationProps {
  page: number          // 0-indexed (matches Spring pageable)
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i
    if (page < 4) return i
    if (page >= totalPages - 4) return totalPages - 7 + i
    return page - 3 + i
  })

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous"
      >
        <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.7rem' }}></i>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn${p === page ? ' active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}

      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Next"
      >
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
      </button>
    </div>
  )
}
