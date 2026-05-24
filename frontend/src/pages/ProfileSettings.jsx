import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfile, changePassword } from '../redux/slices/authSlice'
import { FiUser, FiLock, FiBell, FiShield, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const dispatch = useDispatch()
  const { user, theme } = useSelector(state => state.auth)
  const isDark = theme === 'dark'

  // Profile fields
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification prefs
  const [prefs, setPrefs] = useState({
    ipoOpening: user?.notificationPreferences?.ipoOpening ?? true,
    ipoClosing: user?.notificationPreferences?.ipoClosing ?? true,
    ipoResult: user?.notificationPreferences?.ipoResult ?? true,
    applicationStatus: user?.notificationPreferences?.applicationStatus ?? true,
    email: user?.notificationPreferences?.email ?? true,
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    setSavingProfile(true)
    
    dispatch(updateProfile({ name, phone, notificationPreferences: prefs }))
      .unwrap()
      .then(() => toast.success('Profile updated successfully!'))
      .catch((err) => toast.error(err || 'Failed to update profile'))
      .finally(() => setSavingProfile(false))
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match')
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }

    setSavingPassword(true)
    dispatch(changePassword({ currentPassword, newPassword }))
      .unwrap()
      .then(() => {
        toast.success('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      })
      .catch((err) => toast.error(err || 'Failed to change password'))
      .finally(() => setSavingPassword(false))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Profile Settings</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account credentials, preferences, and alert limits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile info & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* General details */}
          <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FiUser className="text-brand" /> Profile Info
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={isDark ? 'input-dark' : 'input-light'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className={`w-full rounded-lg px-4 py-2.5 outline-none border ${
                    isDark ? 'bg-dark-700/50 border-white/5 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                />
              </div>

              {/* Notification Prefs */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <FiBell size={16} /> Notification Preferences
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { key: 'ipoOpening', label: 'IPO opening announcements' },
                    { key: 'ipoClosing', label: 'IPO closing countdown alerts' },
                    { key: 'ipoResult', label: 'IPO allotment result releases' },
                    { key: 'applicationStatus', label: 'Application status and issues' },
                    { key: 'email', label: 'Receive email copies of alerts' },
                  ].map(pref => (
                    <label key={pref.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs[pref.key]}
                        onChange={(e) => setPrefs(prev => ({ ...prev, [pref.key]: e.target.checked }))}
                        className="w-4 h-4 rounded-sm bg-dark-700 border-white/10 text-brand focus:ring-brand"
                      />
                      <span>{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingProfile}
                className="btn-primary py-2.5 px-6 font-semibold cursor-pointer ml-auto block"
              >
                {savingProfile ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Change Password */}
        <div className="space-y-6">
          <div className={`card p-6 ${isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FiLock className="text-brand" /> Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={isDark ? 'input-dark' : 'input-light'}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={isDark ? 'input-dark' : 'input-light'}
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={isDark ? 'input-dark' : 'input-light'}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={savingPassword}
                className="w-full btn-primary py-2.5 font-semibold cursor-pointer mt-4"
              >
                {savingPassword ? 'Changing...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
