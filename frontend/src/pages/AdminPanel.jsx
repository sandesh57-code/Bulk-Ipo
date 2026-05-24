import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FiShield, FiUsers, FiSliders, FiDatabase, FiSettings, FiPlus, FiZap, FiTrash2, FiPlay } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminPanel() {
  const { theme } = useSelector(state => state.auth)
  const isDark = theme === 'dark'

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [ipos, setIpos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  // Form for custom IPO entry
  const [companyName, setCompanyName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [ipoType, setIpoType] = useState('IPO')
  const [sharePrice, setSharePrice] = useState(100)
  const [minQuantity, setMinQuantity] = useState(10)
  const [openingDate, setOpeningDate] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [ipoStatus, setIpoStatus] = useState('open')

  const fetchData = async () => {
    setLoading(true)
    try {
      const statsRes = await api.get('/admin/stats')
      setStats(statsRes.data.stats)

      const usersRes = await api.get('/admin/users')
      setUsers(usersRes.data.users)

      const iposRes = await api.get('/ipos')
      setIpos(iposRes.data.ipos)
    } catch (err) {
      toast.error('Failed to retrieve administrative details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSeed = async () => {
    try {
      const { data } = await api.post('/admin/seed-ipos')
      toast.success(data.message)
      fetchData()
    } catch (err) {
      toast.error('Seeding failed')
    }
  }

  const handleToggleUserActive = async (userId, currentStatus) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus })
      toast.success(data.message)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u))
    } catch (err) {
      toast.error('Failed to change user status')
    }
  }

  const handlePublishResult = async (id, name) => {
    try {
      const { data } = await api.post(`/admin/ipos/${id}/publish-result`)
      toast.success(`Results published for ${name}!`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish allotment result')
    }
  }

  const handleCreateIpo = async (e) => {
    e.preventDefault()
    if (!companyName || !symbol || !openingDate || !closingDate) {
      return toast.error('Please fill in all required fields')
    }

    try {
      const payload = {
        companyName,
        companyCode: symbol,
        symbol,
        ipoType,
        sharePrice,
        minQuantity,
        openingDate: new Date(openingDate),
        closingDate: new Date(closingDate),
        status: ipoStatus,
      }

      await api.post('/admin/ipos', payload)
      toast.success('Custom IPO entry created successfully!')
      setCompanyName('')
      setSymbol('')
      setOpeningDate('')
      setClosingDate('')
      fetchData()
    } catch (err) {
      toast.error('Failed to write custom IPO entry')
    }
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <FiShield className="text-brand" /> Admin Control Panel
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>System status, user management, and allotment results simulator</p>
        </div>
        
        <button 
          onClick={handleSeed}
          className="btn-primary cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none"
        >
          <FiDatabase size={16} />
          Seed Dev IPO Data
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 gap-4 text-sm font-semibold">
        {[
          { id: 'stats', label: 'Overview', icon: FiSliders },
          { id: 'users', label: 'User Accounts', icon: FiUsers },
          { id: 'ipos', label: 'IPO Listing Management', icon: FiSettings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 cursor-pointer transition-colors ${
              activeTab === tab.id 
                ? 'border-brand text-brand' 
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading administrator configurations...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Stats tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                  <p className="text-xs text-gray-500 font-bold uppercase">System Registered Users</p>
                  <p className="text-3xl font-black mt-1">{stats.totalUsers}</p>
                </div>
                <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                  <p className="text-xs text-gray-500 font-bold uppercase">Total MeroShare Portals Saved</p>
                  <p className="text-3xl font-black mt-1">{stats.totalAccountsSaved}</p>
                </div>
                <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                  <p className="text-xs text-gray-500 font-bold uppercase">Bulk Applications Submitted</p>
                  <p className="text-3xl font-black mt-1">{stats.totalApplications}</p>
                </div>
                <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                  <p className="text-xs text-gray-500 font-bold uppercase">Consolidated Blocked Money</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{formatPrice(stats.totalBlockedCapital)}</p>
                </div>
              </div>

              {/* closed list result simulation panel */}
              <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                <h3 className="text-lg font-bold mb-4">Trigger IPO Result Allotments</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Select a closed IPO to publish the result sheet. This will simulate a MeroShare result checking sequence for all accounts that applied and generate congratulations/regrets notifications.
                </p>

                <div className="space-y-4">
                  {ipos.filter(i => i.status === 'closed').length > 0 ? (
                    ipos.filter(i => i.status === 'closed').map(ipo => (
                      <div 
                        key={ipo._id} 
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                          isDark ? 'bg-dark-700/50 border-white/5' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base">{ipo.companyName}</h4>
                          <p className="text-xs text-gray-500 mt-1">Closed Date: {format(new Date(ipo.closingDate), 'PPP')}</p>
                        </div>
                        <button
                          onClick={() => handlePublishResult(ipo._id, ipo.companyName)}
                          className="btn-success py-2 px-4 text-xs font-semibold cursor-pointer"
                        >
                          <FiPlay size={12} /> Simulate Allotments
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                      No closed IPOs found. Use "Seed Dev IPO Data" above to insert sample listings.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users tab */}
          {activeTab === 'users' && (
            <div className={`card overflow-hidden ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs uppercase font-bold border-b ${
                    isDark ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                  }`}>
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                    {users.map(u => (
                      <tr key={u._id} className={isDark ? 'hover:bg-white/2' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 font-bold">{u.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            u.role === 'admin' ? 'bg-brand/20 text-indigo-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>{u.isActive ? 'Active' : 'Suspended'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {format(new Date(u.createdAt), 'PPP')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleUserActive(u._id, u.isActive)}
                            className={`text-xs font-semibold py-1 px-3 border rounded-lg cursor-pointer transition-colors ${
                              u.isActive 
                                ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' 
                                : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* IPO Listing management tab */}
          {activeTab === 'ipos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* List table */}
              <div className={`lg:col-span-2 card overflow-hidden ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                <div className="p-5 border-b border-white/5">
                  <h3 className="font-bold text-lg">System IPO Listings</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase font-bold border-b ${
                      isDark ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}>
                      <tr>
                        <th className="px-6 py-4">Company Name</th>
                        <th className="px-6 py-4">Symbol</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                      {ipos.map(ipo => (
                        <tr key={ipo._id} className={isDark ? 'hover:bg-white/2' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 font-bold">{ipo.companyName}</td>
                          <td className="px-6 py-4 font-mono text-xs">{ipo.symbol}</td>
                          <td className="px-6 py-4 font-semibold">NPR {ipo.sharePrice}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              ipo.status === 'open' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : ipo.status === 'upcoming' 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>{ipo.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create IPO form */}
              <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <FiPlus className="text-brand" /> Create Custom IPO
                </h3>

                <form onSubmit={handleCreateIpo} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={isDark ? 'input-dark' : 'input-light'}
                      placeholder="e.g. Nabil Bank Limited"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Stock Symbol</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className={isDark ? 'input-dark' : 'input-light'}
                      placeholder="e.g. NABIL"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Share Price</label>
                      <input
                        type="number"
                        value={sharePrice}
                        onChange={(e) => setSharePrice(parseInt(e.target.value) || 100)}
                        className={isDark ? 'input-dark' : 'input-light'}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Min Units</label>
                      <input
                        type="number"
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(parseInt(e.target.value) || 10)}
                        className={isDark ? 'input-dark' : 'input-light'}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Issue Type</label>
                    <select
                      value={ipoType}
                      onChange={(e) => setIpoType(e.target.value)}
                      className={`w-full rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand ${
                        isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="IPO">IPO</option>
                      <option value="FPO">FPO</option>
                      <option value="RIGHT">Right Share</option>
                      <option value="MUTUAL_FUND">Mutual Fund</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Opening Date</label>
                    <input
                      type="date"
                      value={openingDate}
                      onChange={(e) => setOpeningDate(e.target.value)}
                      className={isDark ? 'input-dark' : 'input-light'}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Closing Date</label>
                    <input
                      type="date"
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                      className={isDark ? 'input-dark' : 'input-light'}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Initial Status</label>
                    <select
                      value={ipoStatus}
                      onChange={(e) => setIpoStatus(e.target.value)}
                      className={`w-full rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand ${
                        isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-2.5 font-semibold cursor-pointer mt-4"
                  >
                    Create IPO Issue
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
