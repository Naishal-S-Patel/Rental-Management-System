import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { QuotationStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { quotationApi } from '@/api/quotationApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { QuotationResponse, QuotationStatus } from '@/types/quotation'

const STATUS_TABS: { label: string; value: QuotationStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export function AdminQuotationsPage() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchQuotations = () => {
    setLoading(true)
    quotationApi.list({ status: statusFilter || undefined, page, size: 20 })
      .then(({ data }) => { setQuotations(data.content); setTotalPages(data.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQuotations() }, [statusFilter, page])

  const handleConfirm = async (id: string) => {
    setActionLoading(id)
    try {
      const { data: order } = await quotationApi.confirm(id)
      toast.success('Quotation confirmed — order created.')
      navigate(`/admin/orders/${order.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to confirm.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this quotation?')) return
    setActionLoading(id)
    try {
      await quotationApi.reject(id)
      toast.success('Quotation rejected.')
      fetchQuotations()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject.'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <div className="page-subtitle">In-store quotations for customers</div>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatusFilter(t.value); setPage(0) }}
            style={{ padding: '8px 14px', fontSize: '0.8125rem', fontWeight: statusFilter === t.value ? 600 : 400, border: 'none', borderBottom: `2px solid ${statusFilter === t.value ? 'var(--primary)' : 'transparent'}`, background: 'none', color: statusFilter === t.value ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-overlay"><span className="spinner"></span></div>}

      {!loading && quotations.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-file-invoice"></i>
          <p>No quotations found.</p>
        </div>
      )}

      {!loading && quotations.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>#{q.quotationNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.customerEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(q.validUntil)}</td>
                    <td><QuotationStatusBadge status={q.status} /></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(q.total)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(q.status === 'DRAFT' || q.status === 'SENT') && (
                          <>
                            <button className="btn btn-primary btn-sm" disabled={actionLoading === q.id} onClick={() => void handleConfirm(q.id)}>
                              Confirm
                            </button>
                            <button className="btn btn-danger btn-sm" disabled={actionLoading === q.id} onClick={() => void handleReject(q.id)}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </AppShell>
  )
}
