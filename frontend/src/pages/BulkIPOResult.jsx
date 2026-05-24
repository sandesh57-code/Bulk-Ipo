import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccounts } from '../redux/slices/accountSlice'
import { fetchAllIPOs, checkBulkResults } from '../redux/slices/ipoSlice'
import { FiCheckCircle, FiTrendingUp, FiDownload, FiInfo, FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function BulkIPOResult() {
  const dispatch = useDispatch()
  
  const { theme } = useSelector(state => state.auth)
  const { accounts } = useSelector(state => state.accounts)
  const { allIPOs, results, loading } = useSelector(state => state.ipo)
  const isDark = theme === 'dark'

  const [selectedIpoId, setSelectedIpoId] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkedResults, setCheckedResults] = useState([])

  useEffect(() => {
    dispatch(fetchAccounts())
    // Fetch result-published IPOs
    dispatch(fetchAllIPOs({ limit: 50 }))
  }, [dispatch])

  // Filter IPOs that are closed or result published
  const resultIpos = allIPOs.filter(i => ['result_published', 'allotment_done'].includes(i.status))

  useEffect(() => {
    if (resultIpos.length > 0 && !selectedIpoId) {
      setSelectedIpoId(resultIpos[0]._id)
    }
  }, [resultIpos, selectedIpoId])

  const selectedIpo = allIPOs.find(i => i._id === selectedIpoId)

  const handleCheckResults = async () => {
    if (!selectedIpoId) return toast.error('Please select an IPO')
    if (!accounts.length) return toast.error('No saved accounts to check results for')

    setChecking(true)
    setCheckedResults([])

    try {
      const boids = accounts.map(a => a.boid)
      const payload = {
        boids,
        ipoName: selectedIpo.companyName,
        ipoShareGroupId: selectedIpo.shareGroupId || 1
      }

      // Hit mock bulk check API (or simulate sequential check in frontend for premium loading feel)
      await new Promise(r => setTimeout(r, 1200))
      
      const res = await dispatch(checkBulkResults(payload)).unwrap()
      
      // Map results back to accounts for full details
      const compiled = accounts.map(acc => {
        // Hash calculation identical to mock service to ensure consistency
        const hash = acc.boid.split('').reduce((accVal, char) => accVal + parseInt(char, 10), 0)
        const isAllotted = (hash % 6) === 0
        
        return {
          _id: acc._id,
          nickname: acc.nickname,
          fullName: acc.fullName,
          boid: acc.boid,
          appliedQty: 10, // default mock applied
          allottedQty: isAllotted ? 10 : 0,
          status: isAllotted ? 'allotted' : 'not_allotted',
          remarks: isAllotted ? 'Congratulations! Allotted 10 units.' : 'Not allotted.'
        }
      })

      setCheckedResults(compiled)
      toast.success('Allotment check completed successfully!')
    } catch (err) {
      toast.error('Failed to query results from CDSC mock server')
    } finally {
      setChecking(false)
    }
  }

  // jsPDF allotment report export
  const exportPDF = () => {
    if (!checkedResults.length) return
    const doc = new jsPDF()
    
    doc.text(`IPO Allotment Report: ${selectedIpo.companyName}`, 14, 15)
    doc.text(`Date Checked: ${new Date().toLocaleDateString()}`, 14, 22)

    const tableRows = checkedResults.map(r => [
      r.nickname,
      r.fullName,
      r.boid,
      r.appliedQty.toString(),
      r.allottedQty.toString(),
      r.status.toUpperCase(),
      r.remarks
    ])

    doc.autoTable({
      head: [['Account Nickname', 'Investor Name', 'BOID', 'Applied', 'Allotted', 'Status', 'Remarks']],
      body: tableRows,
      startY: 28,
    })

    doc.save(`IPO-Results-${selectedIpo.symbol || 'Report'}.pdf`)
    toast.success('PDF report downloaded!')
  }

  // CSV allotment report export
  const exportCSV = () => {
    if (!checkedResults.length) return
    const headers = 'Account Nickname,Investor Name,BOID,Applied,Allotted,Status,Remarks\n'
    const rows = checkedResults.map(r => 
      `"${r.nickname}","${r.fullName}","${r.boid}",${r.appliedQty},${r.allottedQty},"${r.status}","${r.remarks}"`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `IPO-Results-${selectedIpo.symbol || 'Report'}.csv`)
    link.click()
    toast.success('CSV downloaded!')
  }

  // Calculate results summary
  const allottedCount = checkedResults.filter(r => r.status === 'allotted').length
  const totalAllottedShares = checkedResults.reduce((sum, r) => sum + r.allottedQty, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black">IPO Results</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Check share allotment results for all saved MeroShare accounts at once</p>
      </div>

      {/* Select IPO card */}
      <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
        <h3 className="text-lg font-bold mb-4">Check Allotment Results</h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : resultIpos.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Select Result Published IPO</label>
              <select
                value={selectedIpoId}
                onChange={(e) => setSelectedIpoId(e.target.value)}
                className={`w-full rounded-lg px-4 py-3 outline-none border focus:ring-2 focus:ring-brand font-semibold ${
                  isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {resultIpos.map(i => (
                  <option key={i._id} value={i._id}>{i.companyName} ({i.symbol || 'N/A'})</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleCheckResults}
              disabled={checking || !accounts.length}
              className="btn-primary py-3 px-6 cursor-pointer flex-shrink-0"
            >
              {checking ? (
                <div className="flex items-center gap-2">
                  <FiLoader className="animate-spin" size={18} />
                  Querying CDSC...
                </div>
              ) : 'Check All Accounts'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            No result-published IPOs found in the database. Seeding data or setting an IPO status to "result_published" as Admin will enable checking.
          </div>
        )}
      </div>

      {/* Results details */}
      {checkedResults.length > 0 && (
        <div className="space-y-6">
          
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`card p-4 text-center ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
              <p className="text-xs text-gray-500 font-bold uppercase">Accounts Checked</p>
              <p className="text-2xl font-black mt-1">{checkedResults.length}</p>
            </div>
            <div className={`card p-4 text-center ${isDark ? 'card-dark bg-dark-800/60 border-l-emerald-500/80 border-l-4' : 'card-light bg-white border-l-emerald-500/80 border-l-4'}`}>
              <p className="text-xs text-emerald-400 font-bold uppercase">Accounts Allotted</p>
              <p className="text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                {allottedCount}
                <FiCheckCircle size={20} />
              </p>
            </div>
            <div className={`card p-4 text-center ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
              <p className="text-xs text-gray-500 font-bold uppercase">Total Shares Allotted</p>
              <p className="text-2xl font-black mt-1">{totalAllottedShares} Units</p>
            </div>
          </div>

          {/* Results table */}
          <div className={`card overflow-hidden ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-lg">Allotment Sheet</h3>
              
              <div className="flex gap-2">
                <button onClick={exportPDF} className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer">
                  <FiDownload size={14} /> PDF Report
                </button>
                <button onClick={exportCSV} className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer">
                  <FiDownload size={14} /> CSV Sheet
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase font-bold border-b ${isDark ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <tr>
                    <th className="px-6 py-4">Account Nickname</th>
                    <th className="px-6 py-4">Investor Name</th>
                    <th className="px-6 py-4">BOID</th>
                    <th className="px-6 py-4">Applied</th>
                    <th className="px-6 py-4">Allotted</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {checkedResults.map((r, index) => (
                    <tr key={r._id} className={isDark ? 'hover:bg-white/2' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 font-bold">{r.nickname}</td>
                      <td className="px-6 py-4">{r.fullName}</td>
                      <td className="px-6 py-4 font-mono text-xs">{r.boid}</td>
                      <td className="px-6 py-4 font-semibold">{r.appliedQty} Units</td>
                      <td className="px-6 py-4 font-extrabold text-brand">{r.allottedQty} Units</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          r.status === 'allotted' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {r.status === 'allotted' ? 'ALLOTTED 🎉' : 'NOT ALLOTTED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
