import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccounts } from '../redux/slices/accountSlice'
import { fetchOpenIPOs, bulkApplyIPO, syncIPOs, fetchSyncStatus } from '../redux/slices/ipoSlice'
import { FiZap, FiCheck, FiX, FiAlertCircle, FiLoader, FiRefreshCw } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function BulkApplyIPO() {
  const dispatch = useDispatch()
  
  const { theme } = useSelector(state => state.auth)
  const { accounts } = useSelector(state => state.accounts)
  const { openIPOs, applying, loading: ipoLoading, syncing, syncStatus } = useSelector(state => state.ipo)
  const isDark = theme === 'dark'

  const [selectedIpoId, setSelectedIpoId] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [quantity, setQuantity] = useState(10)
  
  // Progress tracker
  const [isApplyingLocal, setIsApplyingLocal] = useState(false)
  const [progressLog, setProgressLog] = useState([])

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchOpenIPOs())
    dispatch(fetchSyncStatus())
  }, [dispatch])

  useEffect(() => {
    if (openIPOs.length > 0 && !selectedIpoId) {
      setSelectedIpoId(openIPOs[0]._id)
    }
  }, [openIPOs, selectedIpoId])

  const selectedIpo = openIPOs.find(i => i._id === selectedIpoId)

  const handleToggleAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedAccounts(accounts.map(a => a._id))
  }

  const handleDeselectAll = () => {
    setSelectedAccounts([])
  }

  const handleApply = async () => {
    if (!selectedIpoId) return toast.error('Please select an IPO')
    if (!selectedAccounts.length) return toast.error('Please select at least one account')
    if (quantity < 10 || quantity % 10 !== 0) return toast.error('Quantity must be a multiple of 10')

    setIsApplyingLocal(true)
    setProgressLog(selectedAccounts.map(id => {
      const acc = accounts.find(a => a._id === id)
      return {
        id,
        nickname: acc?.nickname || 'Unknown',
        status: 'pending',
        message: 'Waiting in queue...'
      }
    }))

    try {
      const payload = {
        ipoId: selectedIpoId,
        accountIds: selectedAccounts,
        quantity,
      }

      // Simulate sequential steps in UI for premium experience
      for (let i = 0; i < selectedAccounts.length; i++) {
        const id = selectedAccounts[i]
        
        // Mark as processing
        setProgressLog(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'processing', message: 'Logging into MeroShare...' } : item
        ))
        
        await new Promise(r => setTimeout(r, 600))

        setProgressLog(prev => prev.map(item => 
          item.id === id ? { ...item, message: 'Submitting IPO application...' } : item
        ))

        await new Promise(r => setTimeout(r, 600))
      }

      // Trigger actual bulk apply API
      const response = await dispatch(bulkApplyIPO(payload)).unwrap()
      
      // Update progress with real response results
      setProgressLog(prev => prev.map(item => {
        const matchingResult = response.results.find(r => r.accountId === item.id)
        if (matchingResult) {
          return {
            ...item,
            status: ['applied', 'amount_blocked', 'unverified'].includes(matchingResult.status) ? 'success' : 'failed',
            message: matchingResult.status === 'success' || ['applied', 'amount_blocked', 'unverified'].includes(matchingResult.status)
              ? `Applied successfully. Code: ${matchingResult.applicationNumber}`
              : matchingResult.errorMessage || matchingResult.message || 'Application rejected.'
          }
        }
        return item
      }))

      toast.success('Bulk IPO process completed!')
    } catch (err) {
      toast.error(err || 'Failed to complete bulk IPO process')
    }
  }

  const handleSync = async () => {
    try {
      const response = await dispatch(syncIPOs()).unwrap()
      toast.success(response.message || 'Sync completed successfully!')
      dispatch(fetchOpenIPOs())
      dispatch(fetchSyncStatus())
    } catch (err) {
      toast.error(err || 'Sync failed')
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
          <h1 className="text-2xl md:text-3xl font-black">Bulk Apply IPO</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Apply for shares across multiple Demat accounts instantly</p>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus?.lastSync?.at && (
            <div className="text-right hidden md:block">
              <p className="text-[10px] uppercase font-bold text-gray-500">Last Live Sync</p>
              <p className="text-xs font-semibold text-gray-400">
                {formatDistanceToNow(new Date(syncStatus.lastSync.at), { addSuffix: true })} ({syncStatus.lastSync.source})
              </p>
            </div>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`btn-secondary flex items-center gap-2 cursor-pointer py-2 px-4 text-xs font-semibold ${
              syncing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <FiRefreshCw className={syncing ? 'animate-spin' : ''} size={14} />
            {syncing ? 'Syncing Live...' : 'Sync Live Data'}
          </button>
        </div>
      </div>
        
        {/* Left Side: Select IPO & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Select IPO card */}
          <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <h3 className="text-lg font-bold mb-4">1. Select Open Issue</h3>
            
            {ipoLoading ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : openIPOs.length > 0 ? (
              <div className="space-y-4">
                <select
                  value={selectedIpoId}
                  onChange={(e) => setSelectedIpoId(e.target.value)}
                  className={`w-full rounded-lg px-4 py-3 outline-none border focus:ring-2 focus:ring-brand font-semibold ${
                    isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {openIPOs.map(i => (
                    <option key={i._id} value={i._id}>{i.companyName} ({i.ipoType})</option>
                  ))}
                </select>

                {selectedIpo && (
                  <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm ${
                    isDark ? 'bg-dark-700/30 border-white/5' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Share Price</p>
                      <p className="font-extrabold text-base text-brand mt-0.5">NPR {selectedIpo.sharePrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Min Quantity</p>
                      <p className="font-extrabold text-base mt-0.5">{selectedIpo.minQuantity} Units</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Issue Manager</p>
                      <p className="font-semibold mt-0.5 truncate">{selectedIpo.issueManager || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Sector</p>
                      <p className="font-semibold mt-0.5 truncate">{selectedIpo.sector || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No active IPOs open currently. Seeding IPO data or checking back later might help.
              </div>
            )}
          </div>

          {/* Accounts selection card */}
          <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold">2. Select Target Accounts</h3>
              <div className="flex gap-2">
                <button onClick={handleSelectAll} className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer">Select All</button>
                <button onClick={handleDeselectAll} className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer">Deselect All</button>
              </div>
            </div>

            {accounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
                {accounts.map(acc => {
                  const isSelected = selectedAccounts.includes(acc._id)
                  return (
                    <div 
                      key={acc._id} 
                      onClick={() => handleToggleAccount(acc._id)}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-brand bg-brand/5 shadow-xs' 
                          : isDark 
                          ? 'border-white/5 bg-dark-700/20 hover:bg-dark-700/40 text-gray-300' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-sm truncate">{acc.nickname}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{acc.fullName}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">{acc.boid}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-brand border-brand text-white' : isDark ? 'border-white/20' : 'border-gray-300'
                      }`}>
                        {isSelected && <FiCheck size={14} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No accounts found. Please go to <span className="font-semibold text-brand">Saved Accounts</span> to add profiles first.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Block Summary & Action */}
        <div className="space-y-6">
          <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <h3 className="text-lg font-bold mb-4">3. Application Config</h3>

            <div className="space-y-5">
              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">Apply Quantity (Units)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 0))}
                  step={10}
                  min={10}
                  className={isDark ? 'input-dark' : 'input-light'}
                  required
                />
                <p className="text-[10px] text-gray-500">Must be a multiple of 10 (Minimum 10 units)</p>
              </div>

              {/* Summary */}
              {selectedIpo && (
                <div className={`p-4 rounded-xl border space-y-3 text-sm ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Accounts</span>
                    <span className="font-bold">{selectedAccounts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shares per Account</span>
                    <span className="font-bold">{quantity} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price per Share</span>
                    <span className="font-bold">NPR {selectedIpo.sharePrice}</span>
                  </div>
                  <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center">
                    <span className="text-gray-400 font-semibold">Total Blocked Capital</span>
                    <span className="text-lg font-black text-brand">
                      {formatPrice(selectedAccounts.length * quantity * selectedIpo.sharePrice)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleApply}
                disabled={!selectedAccounts.length || isApplyingLocal || ipoLoading}
                className="w-full btn-primary py-3 cursor-pointer shadow-lg shadow-brand/20 hover:shadow-brand/40"
              >
                {isApplyingLocal ? (
                  <div className="flex items-center gap-2">
                    <FiLoader className="animate-spin" size={18} />
                    Processing Applications...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FiZap size={18} />
                    Apply in Bulk Now
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Progress Tracker Log Panel */}
          <AnimatePresence>
            {isApplyingLocal && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm">Bulk Submission Status</h4>
                  <button 
                    onClick={() => setIsApplyingLocal(false)} 
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Clear Log
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-hide">
                  {progressLog.map(log => (
                    <div key={log.id} className="flex items-start justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold">{log.nickname}</p>
                        <p className="text-gray-500 mt-0.5">{log.message}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {log.status === 'pending' && <span className="w-2 h-2 bg-gray-600 rounded-full inline-block animate-pulse" />}
                        {log.status === 'processing' && <FiLoader className="animate-spin text-brand" size={14} />}
                        {log.status === 'success' && <FiCheck className="text-emerald-400" size={16} />}
                        {log.status === 'failed' && <FiX className="text-red-400" size={16} />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
