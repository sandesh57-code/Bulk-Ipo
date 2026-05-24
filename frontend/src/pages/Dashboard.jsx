import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { fetchAccounts } from '../redux/slices/accountSlice'
import { fetchOpenIPOs } from '../redux/slices/ipoSlice'
import { fetchPortfolio } from '../redux/slices/portfolioSlice'
import { fetchReports } from '../redux/slices/reportSlice'
import StatCard from '../components/StatCard'
import { FiUsers, FiPieChart, FiTrendingUp, FiZap, FiCheckCircle, FiPlus, FiArrowRight, FiFileText } from 'react-icons/fi'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { theme } = useSelector(state => state.auth)
  const { accounts } = useSelector(state => state.accounts)
  const { openIPOs, loading: ipoLoading } = useSelector(state => state.ipo)
  const { summary, consolidatedHoldings } = useSelector(state => state.portfolio)
  const { reports } = useSelector(state => state.reports)

  const isDark = theme === 'dark'

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchOpenIPOs())
    dispatch(fetchPortfolio())
    dispatch(fetchReports({ limit: 5 }))
  }, [dispatch])

  // Prepare sector data for Recharts Pie Chart
  const sectorData = consolidatedHoldings.reduce((acc, holding) => {
    const sector = holding.sector || 'Others'
    const existing = acc.find(item => item.name === sector)
    if (existing) {
      existing.value += holding.currentValue
    } else {
      acc.push({ name: sector, value: holding.currentValue })
    }
    return acc;
  }, [])

  // Prepare mock portfolio performance chart data
  const chartData = [
    { name: 'Jan', value: summary.totalInvestment * 0.9 || 50000 },
    { name: 'Feb', value: summary.totalInvestment * 0.95 || 62000 },
    { name: 'Mar', value: summary.totalInvestment * 1.05 || 85000 },
    { name: 'Apr', value: summary.totalInvestment * 1.1 || 98000 },
    { name: 'May', value: summary.currentValue || 120540 },
  ]

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header and Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Dashboard</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real-time overview of your bulk IPO portfolio activity</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => dispatch(fetchPortfolio({ sync: true }))}
            className="btn-primary cursor-pointer"
          >
            <FiZap size={18} />
            Sync Holdings
          </button>
          <Link to="/accounts" className="btn-secondary cursor-pointer">
            <FiPlus size={18} />
            Add Account
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saved Accounts"
          value={accounts.length}
          subtitle="Linked MeroShare accounts"
          icon={FiUsers}
          color="brand"
          index={0}
        />
        <StatCard
          title="Consolidated Portfolio"
          value={formatPrice(summary.currentValue)}
          subtitle={`Investment: ${formatPrice(summary.totalInvestment)}`}
          icon={FiPieChart}
          color="info"
          index={1}
        />
        <StatCard
          title="Total Profit/Loss"
          value={formatPrice(summary.totalProfitLoss)}
          subtitle={summary.totalProfitLoss >= 0 ? `${summary.totalProfitLossPercent.toFixed(1)}% All-time Gain` : `${summary.totalProfitLossPercent.toFixed(1)}% Loss`}
          icon={FiTrendingUp}
          color={summary.totalProfitLoss >= 0 ? 'success' : 'danger'}
          index={2}
        />
        <StatCard
          title="Open IPOs"
          value={openIPOs.length}
          subtitle="Currently open for application"
          icon={FiZap}
          color="warning"
          index={3}
        />
      </div>

      {/* Main Charts & Active IPO split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Area Chart */}
        <div className={`lg:col-span-2 card p-6 ${isDark ? 'card-dark' : 'card-light'}`}>
          <h3 className="text-lg font-bold mb-4">Portfolio Growth</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={isDark ? '#4b5563' : '#9ca3af'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isDark ? '#4b5563' : '#9ca3af'} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1a1a2e' : '#fff', 
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    color: isDark ? '#fff' : '#000'
                  }} 
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation Pie Chart */}
        <div className={`card p-6 ${isDark ? 'card-dark' : 'card-light'}`}>
          <h3 className="text-lg font-bold mb-2">Sector Allocation</h3>
          <p className="text-xs text-gray-500 mb-4">Diversification by industry sectors</p>
          <div className="h-56 relative flex items-center justify-center">
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPrice(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-gray-500">Sync portfolio to load allocations.</div>
            )}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs max-h-24 overflow-y-auto scrollbar-hide">
            {sectorData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open IPOs and Recent Applications splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open IPOs */}
        <div className={`card p-6 ${isDark ? 'card-dark' : 'card-light'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Open IPO Issues</h3>
            <Link to="/bulk-apply" className="text-xs text-brand hover:underline font-semibold flex items-center gap-1">
              Apply Screen <FiArrowRight />
            </Link>
          </div>

          <div className="space-y-4">
            {ipoLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : openIPOs.length > 0 ? (
              openIPOs.map(ipo => (
                <div 
                  key={ipo._id} 
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDark ? 'bg-dark-700/50 border-white/5' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base">{ipo.companyName}</h4>
                      <span className="badge-warning text-[10px] uppercase font-bold">{ipo.ipoType}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Closing Date: {format(new Date(ipo.closingDate), 'PPP')} • Manager: {ipo.issueManager || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right sm:mr-2">
                      <p className="text-xs text-gray-500 font-medium">Price per Share</p>
                      <p className="font-extrabold text-sm sm:text-base text-brand">NPR {ipo.sharePrice}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/bulk-apply')
                      }}
                      className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No active IPOs open currently.
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className={`card p-6 ${isDark ? 'card-dark' : 'card-light'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Recent IPO Applications</h3>
            <Link to="/reports" className="text-xs text-brand hover:underline font-semibold flex items-center gap-1">
              All Reports <FiArrowRight />
            </Link>
          </div>

          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map(app => (
                <div 
                  key={app._id} 
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    isDark ? 'bg-dark-700/50 border-white/5' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{app.ipo?.companyName || 'Unknown IPO'}</h4>
                    </div>
                    <p className="text-xs text-gray-500">
                      Applied: {app.appliedQuantity} Units • Account: {app.account?.nickname || 'Account Deleted'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      ['applied', 'amount_blocked', 'verified'].includes(app.status)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : app.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {app.status}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1">{format(new Date(app.appliedAt), 'MMM dd, h:mm a')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent IPO applications found. Start applying!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
