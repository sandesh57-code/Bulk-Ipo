import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchReports, retryApplication } from '../redux/slices/reportSlice'
import { fetchAccounts } from '../redux/slices/accountSlice'
import { FiRefreshCw, FiAlertTriangle, FiInfo, FiChevronLeft, FiChevronRight, FiLoader, FiZap } from 'react-icons/fi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Reports() {
  const dispatch = useDispatch()
  
  const { theme } = useSelector(state => state.auth)
  const { accounts } = useSelector(state => state.accounts)
  const { reports, totalPages, loading } = useSelector(state => state.reports)
  const isDark = theme === 'dark'

  const [statusFilter, setStatusFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [page, setPage] = useState(1)
  
  // Track individual retrying app IDs
  const [retryingIds, setRetryingIds] = useState([])

  useEffect(() => {
    dispatch(fetchAccounts())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchReports({ status: statusFilter, accountId: accountFilter, page }))
  }, [dispatch, statusFilter, accountFilter, page])

  const handleRetry = async (id) => {
    setRetryingIds(prev => [...prev, id])
    try {
      const result = await dispatch(retryApplication(id)).unwrap()
      toast.success(`Application retried successfully! New status: ${result.status}`)
    } catch (err) {
      toast.error(err || 'Retry failed')
    } finally {
      setRetryingIds(prev => prev.filter(aId => aId !== id))
    }
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Application Reports</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Review histories of all bulk IPO submissions and retry failed entries</p>
      </div>

      {/* Filter card */}
      <div className={`card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end ${
        isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'
      }`}>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className={`w-full rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand font-semibold ${
              isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="amount_blocked">Amount Blocked</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="failed">Failed</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Filter Account</label>
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setPage(1) }}
            className={`w-full rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand font-semibold ${
              isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>{acc.nickname}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => { setStatusFilter(''); setAccountFilter(''); setPage(1) }}
          className="btn-secondary py-2.5 justify-center cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Reports sheet */}
      {loading && reports.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading reports...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          <div className={`card overflow-hidden ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase font-bold border-b ${
                  isDark ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                }`}>
                  <tr>
                    <th className="px-6 py-4">IPO Details</th>
                    <th className="px-6 py-4">MeroShare Profile</th>
                    <th className="px-6 py-4">Units Applied</th>
                    <th className="px-6 py-4">Total Price</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Allotment Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {reports.map(app => {
                    const isRetrying = retryingIds.includes(app._id)
                    const canRetry = ['failed', 'error'].includes(app.status)
                    
                    return (
                      <tr key={app._id} className={isDark ? 'hover:bg-white/2' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-extrabold text-sm">{app.ipo?.companyName || 'Unknown IPO'}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Code: {app.ipo?.symbol || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold">{app.account?.nickname || 'Account Deleted'}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Demat: {app.account?.boid || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">{app.appliedQuantity} Units</td>
                        <td className="px-6 py-4 font-bold text-brand">{formatPrice(app.appliedAmount)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {format(new Date(app.appliedAt), 'MMM dd, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              ['applied', 'amount_blocked', 'verified'].includes(app.status)
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10'
                                : app.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10'
                                : 'bg-red-500/20 text-red-400 border border-red-500/10'
                            }`}>
                              {app.status}
                            </span>
                            {app.errorMessage && (
                              <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={app.errorMessage}>
                                {app.errorMessage}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canRetry && (
                            <button
                              onClick={() => handleRetry(app._id)}
                              disabled={isRetrying}
                              className="btn-primary py-1 px-3 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                            >
                              {isRetrying ? (
                                <FiLoader className="animate-spin" size={12} />
                              ) : (
                                <FiRefreshCw size={12} />
                              )}
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn-secondary p-2 cursor-pointer disabled:opacity-50"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="btn-secondary p-2 cursor-pointer disabled:opacity-50"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`card p-12 text-center max-w-xl mx-auto mt-12 ${isDark ? 'card-dark bg-dark-800/40' : 'card-light bg-white'}`}>
          <div className="flex justify-center text-brand mb-4">
            <FiAlertTriangle size={56} />
          </div>
          <h2 className="text-xl font-bold">No Applications Found</h2>
          <p className={`text-sm mt-2 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No IPO application records match the selected filters.
          </p>
        </div>
      )}
    </div>
  )
}
