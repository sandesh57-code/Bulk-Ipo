import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccounts } from '../redux/slices/accountSlice'
import { fetchPortfolio, setSelectedAccount } from '../redux/slices/portfolioSlice'
import { FiPieChart, FiTrendingUp, FiTrendingDown, FiDownload, FiZap, FiLoader } from 'react-icons/fi'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Portfolio() {
  const dispatch = useDispatch()
  
  const { theme } = useSelector(state => state.auth)
  const { accounts } = useSelector(state => state.accounts)
  const { portfolios, consolidatedHoldings, summary, loading, selectedAccount } = useSelector(state => state.portfolio)
  const isDark = theme === 'dark'

  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchPortfolio())
  }, [dispatch])

  const handleAccountChange = (e) => {
    const val = e.target.value
    dispatch(setSelectedAccount(val || null))
    dispatch(fetchPortfolio({ accountId: val }))
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await dispatch(fetchPortfolio({ accountId: selectedAccount, sync: true })).unwrap()
      toast.success('Holdings synced from MeroShare mock successfully!')
    } catch (err) {
      toast.error('Sync failed: Could not connect to CDSC server')
    } finally {
      setSyncing(false)
    }
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(val)
  }

  // Choose which holdings list to display
  const holdingsDisplay = selectedAccount 
    ? (portfolios.find(p => p.account?._id === selectedAccount)?.holdings || [])
    : consolidatedHoldings

  // Prepare sector allocation chart data
  const sectorData = holdingsDisplay.reduce((acc, holding) => {
    const sector = holding.sector || 'Others'
    const existing = acc.find(item => item.name === sector)
    if (existing) {
      existing.value += holding.currentValue
    } else {
      acc.push({ name: sector, value: holding.currentValue })
    }
    return acc
  }, [])

  // export PDF
  const exportPDF = () => {
    if (!holdingsDisplay.length) return
    const doc = new jsPDF()
    doc.text(`Demat Portfolio Holdings Report`, 14, 15)
    doc.text(`Account: ${selectedAccount ? accounts.find(a => a._id === selectedAccount)?.nickname : 'Consolidated (All Accounts)'}`, 14, 22)
    doc.text(`Total Value: ${formatPrice(summary.currentValue)}`, 14, 29)

    const tableRows = holdingsDisplay.map(h => [
      h.companyName,
      h.symbol,
      h.quantity.toString(),
      h.wacc.toString(),
      h.lastTransactionPrice.toString(),
      h.totalCost.toString(),
      h.currentValue.toString(),
      h.profitLoss >= 0 ? `+${h.profitLoss.toString()}` : h.profitLoss.toString(),
    ])

    doc.autoTable({
      head: [['Company Name', 'Symbol', 'Quantity', 'WACC', 'Current Price', 'Total Cost', 'Current Value', 'Gain/Loss']],
      body: tableRows,
      startY: 35,
    })

    doc.save(`Holdings-Report.pdf`)
    toast.success('Report PDF saved!')
  }

  // export CSV
  const exportCSV = () => {
    if (!holdingsDisplay.length) return
    const headers = 'Company Name,Symbol,Quantity,WACC,Current Price,Total Cost,Current Value,Gain/Loss\n'
    const rows = holdingsDisplay.map(h => 
      `"${h.companyName}","${h.symbol}",${h.quantity},${h.wacc},${h.lastTransactionPrice},${h.totalCost},${h.currentValue},${h.profitLoss}`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Holdings-Report.csv`)
    link.click()
    toast.success('CSV downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Portfolio</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Consolidated demat share portfolio holdings and value trackers</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSync}
            disabled={syncing || loading}
            className="btn-primary cursor-pointer"
          >
            {syncing ? <FiLoader className="animate-spin" size={18} /> : <FiZap size={18} />}
            Sync Demat Shares
          </button>
        </div>
      </div>

      {/* Select filter & Export */}
      <div className={`card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-bold text-gray-500 flex-shrink-0">Filter Account:</span>
          <select
            value={selectedAccount || ''}
            onChange={handleAccountChange}
            className={`rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand font-semibold ${
              isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Consolidated (All Accounts)</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>{acc.nickname} ({acc.fullName})</option>
            ))}
          </select>
        </div>

        {holdingsDisplay.length > 0 && (
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button onClick={exportPDF} className="btn-secondary py-2 px-3 text-xs font-semibold cursor-pointer">
              <FiDownload size={14} /> PDF
            </button>
            <button onClick={exportCSV} className="btn-secondary py-2 px-3 text-xs font-semibold cursor-pointer">
              <FiDownload size={14} /> CSV
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
          <p className="text-xs text-gray-500 font-bold uppercase">Total Investment</p>
          <h3 className="text-2xl font-black mt-1">{formatPrice(summary.totalInvestment)}</h3>
        </div>
        <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
          <p className="text-xs text-gray-500 font-bold uppercase">Current Value</p>
          <h3 className="text-2xl font-black text-brand mt-1">{formatPrice(summary.currentValue)}</h3>
        </div>
        <div className={`card p-6 ${
          summary.totalProfitLoss >= 0 
            ? 'border-l-emerald-500/80 border-l-4' 
            : 'border-l-red-500/80 border-l-4'
        } ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
          <p className="text-xs text-gray-500 font-bold uppercase">Total Profit / Loss</p>
          <h3 className={`text-2xl font-black mt-1 flex items-center gap-1.5 ${
            summary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatPrice(summary.totalProfitLoss)}
            {summary.totalProfitLoss >= 0 ? <FiTrendingUp size={20} /> : <FiTrendingDown size={20} />}
          </h3>
        </div>
        <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
          <p className="text-xs text-gray-500 font-bold uppercase">Total Holding Scripts</p>
          <h3 className="text-2xl font-black mt-1">{holdingsDisplay.length} Companies</h3>
        </div>
      </div>

      {/* Grid Layout: Table & Chart splits */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading portfolio details...</p>
        </div>
      ) : holdingsDisplay.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Holdings Table */}
          <div className={`xl:col-span-2 card overflow-hidden ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <div className="p-5 border-b border-white/5">
              <h3 className="font-bold text-lg">Assets Sheet</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase font-bold border-b ${
                  isDark ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                }`}>
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">WACC</th>
                    <th className="px-6 py-4">Current Price</th>
                    <th className="px-6 py-4">Current Value</th>
                    <th className="px-6 py-4">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {holdingsDisplay.map(h => (
                    <tr key={h.symbol} className={isDark ? 'hover:bg-white/2' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold">{h.companyName}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">ISIN: {h.isin || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-brand">{h.symbol}</td>
                      <td className="px-6 py-4 font-semibold">{h.quantity}</td>
                      <td className="px-6 py-4">NPR {h.wacc}</td>
                      <td className="px-6 py-4 font-semibold">NPR {h.lastTransactionPrice}</td>
                      <td className="px-6 py-4 font-bold">{formatPrice(h.currentValue)}</td>
                      <td className="px-6 py-4">
                        <div className={h.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          <p className="font-bold flex items-center gap-1">
                            {h.profitLoss >= 0 ? '+' : ''}{formatPrice(h.profitLoss)}
                          </p>
                          <p className="text-xs font-semibold">
                            {h.profitLoss >= 0 ? '+' : ''}{h.profitLossPercent.toFixed(1)}%
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sector bar chart */}
          <div className="space-y-6">
            <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
              <h3 className="text-lg font-bold mb-6">Allocation Value</h3>
              <div className="h-64">
                {sectorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <XAxis type="number" stroke={isDark ? '#4b5563' : '#9ca3af'} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke={isDark ? '#4b5563' : '#9ca3af'} tick={{ fontSize: 9 }} width={80} />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-20 text-gray-500">No chart data.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className={`card p-12 text-center max-w-xl mx-auto mt-12 ${isDark ? 'card-dark bg-dark-800/40' : 'card-light bg-white'}`}>
          <div className="flex justify-center text-brand mb-4">
            <FiPieChart size={56} />
          </div>
          <h2 className="text-xl font-bold">No Portfolio Data</h2>
          <p className={`text-sm mt-2 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            You haven't synced your demat holdings yet or don't have any saved MeroShare accounts.
          </p>
          <button 
            onClick={handleSync}
            disabled={syncing || !accounts.length}
            className="btn-primary mt-6 mx-auto cursor-pointer"
          >
            <FiZap size={18} />
            Sync Now
          </button>
        </div>
      )}
    </div>
  )
}
