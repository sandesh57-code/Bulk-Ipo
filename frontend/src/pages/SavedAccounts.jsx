import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccounts, addAccount, updateAccount, deleteAccount } from '../redux/slices/accountSlice'
import { FiPlus, FiEdit, FiTrash2, FiUser, FiCreditCard, FiLock, FiInfo, FiTag, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function SavedAccounts() {
  const dispatch = useDispatch()
  const { accounts, loading } = useSelector(state => state.accounts)
  const { theme } = useSelector(state => state.auth)
  const isDark = theme === 'dark'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form fields
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [boid, setBoid] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [bankName, setBankName] = useState('')
  const [crnNumber, setCrnNumber] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState('self')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    dispatch(fetchAccounts())
  }, [dispatch])

  const openAddModal = () => {
    setEditingId(null)
    setNickname('')
    setFullName('')
    setBoid('')
    setLoginId('')
    setPassword('')
    setBankName('')
    setCrnNumber('')
    setMobileNumber('')
    setEmail('')
    setAccountType('self')
    setTagsInput('')
    setIsModalOpen(true)
  }

  const openEditModal = (acc) => {
    setEditingId(acc._id)
    setNickname(acc.nickname || '')
    setFullName(acc.fullName || '')
    setBoid(acc.boid || '')
    setLoginId(acc.loginId || '')
    setPassword('') // do not populate password for security
    setBankName(acc.bankName || '')
    setCrnNumber(acc.crnNumber || '')
    setMobileNumber(acc.mobileNumber || '')
    setEmail(acc.email || '')
    setAccountType(acc.accountType || 'self')
    setTagsInput(acc.tags ? acc.tags.join(', ') : '')
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      dispatch(deleteAccount(id))
        .unwrap()
        .then(() => toast.success('Account deleted successfully'))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!nickname || !fullName || !boid || !loginId || (!editingId && !password) || !bankName || !crnNumber) {
      return toast.error('Please fill in all required fields')
    }

    if (boid.length !== 16 || isNaN(boid)) {
      return toast.error('BOID must be a 16-digit number')
    }

    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : []

    const payload = {
      nickname,
      fullName,
      loginId,
      bankName,
      crnNumber,
      mobileNumber,
      email,
      accountType,
      tags,
    }

    if (password) payload.password = password
    if (editingId) payload.id = editingId

    const action = editingId 
      ? dispatch(updateAccount(payload))
      : dispatch(addAccount({ ...payload, boid })) // BOID cannot be changed on edit

    action.unwrap()
      .then((res) => {
        toast.success(editingId ? 'Account updated' : 'Account added successfully')
        setIsModalOpen(false)
      })
      .catch((err) => {
        toast.error(err || 'Failed to save account')
      })
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Saved Accounts</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage multiple MeroShare profiles and track allotments</p>
        </div>
        <button onClick={openAddModal} className="btn-primary cursor-pointer">
          <FiPlus size={18} />
          Add Account
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading saved MeroShare accounts...</p>
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div 
              key={acc._id} 
              className={`card flex flex-col justify-between overflow-hidden shadow-md group ${
                isDark ? 'card-dark hover:border-brand/40 bg-dark-800/60' : 'card-light hover:border-brand/40 bg-white'
              }`}
            >
              {/* Card Header */}
              <div className={`p-5 border-b ${isDark ? 'border-white/5 bg-white/2' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                      {acc.nickname}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        acc.accountType === 'self' 
                          ? 'bg-brand/20 text-indigo-400' 
                          : acc.accountType === 'family' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {acc.accountType}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{acc.fullName}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => openEditModal(acc)} 
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDark ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-black'
                      }`}
                    >
                      <FiEdit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc._id)} 
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDark ? 'border-white/10 hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'border-gray-200 hover:bg-red-500/10 text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-3 text-sm flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">BOID (Demat)</span>
                  <span className="font-mono font-bold">{acc.boid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Login ID</span>
                  <span className="font-semibold">{acc.loginId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">CRN / Bank</span>
                  <span className="font-semibold text-right max-w-[150px] truncate">{acc.crnNumber} • {acc.bankName}</span>
                </div>
                
                {/* Stats */}
                <div className={`grid grid-cols-3 gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Applied</p>
                    <p className="text-base font-extrabold mt-0.5">{acc.totalApplied}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Allotted</p>
                    <p className="text-base font-extrabold text-emerald-400 mt-0.5">{acc.totalAllotted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Blocked</p>
                    <p className="text-xs font-black text-amber-400 mt-1 max-w-[80px] truncate mx-auto">{formatPrice(acc.totalAmountBlocked)}</p>
                  </div>
                </div>

                {/* Tags */}
                {acc.tags && acc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {acc.tags.map(t => (
                      <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`card p-12 text-center max-w-xl mx-auto mt-12 ${isDark ? 'card-dark bg-dark-800/40' : 'card-light bg-white'}`}>
          <div className="flex justify-center text-brand mb-4">
            <FiCreditCard size={56} />
          </div>
          <h2 className="text-xl font-bold">No MeroShare Accounts Saved</h2>
          <p className={`text-sm mt-2 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            You haven't added any MeroShare accounts yet. Add accounts to start bulk-applying for IPOs.
          </p>
          <button onClick={openAddModal} className="btn-primary mt-6 mx-auto cursor-pointer">
            <FiPlus size={18} />
            Add Your First Account
          </button>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className={`w-full max-w-2xl rounded-2xl border p-6 overflow-y-auto max-h-[90vh] shadow-2xl relative ${
              isDark ? 'bg-dark-800 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
              {editingId ? 'Edit MeroShare Account' : 'Add MeroShare Account'}
              <span className="text-xs text-gray-500 font-medium">(Credentials are encrypted locally)</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nickname */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Account Nickname *</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="e.g. My Account, Dad's Demat"
                    required
                  />
                </div>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Investor Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="As in Demat details"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BOID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">16-Digit BOID *</label>
                  <input
                    type="text"
                    value={boid}
                    onChange={(e) => setBoid(e.target.value)}
                    disabled={!!editingId}
                    maxLength={16}
                    className={isDark ? 'input-dark disabled:opacity-50' : 'input-light disabled:opacity-50'}
                    placeholder="1301010000XXXXXX"
                    required
                  />
                </div>
                {/* Login Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">MeroShare Login ID *</label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="Username/Code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    MeroShare Password {editingId && '(Leave blank to keep current)'} *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="••••••••"
                    required={!editingId}
                  />
                </div>
                {/* CRN Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">CRN Number *</label>
                  <input
                    type="text"
                    value={crnNumber}
                    onChange={(e) => setCrnNumber(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="e.g. C-10293"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="e.g. NIC Asia Bank Limited"
                    required
                  />
                </div>
                {/* Account Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Account Category</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className={`w-full rounded-lg px-4 py-2.5 outline-none border focus:ring-2 focus:ring-brand ${
                      isDark ? 'bg-dark-700 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="self">Self</option>
                    <option value="family">Family</option>
                    <option value="friend">Friend / Client</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="98XXXXXXXX"
                  />
                </div>
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={isDark ? 'input-dark' : 'input-light'}
                  placeholder="e.g. primary, active, student"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Verify & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
