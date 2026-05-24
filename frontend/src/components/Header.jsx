import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleMobileSidebar } from '../redux/slices/uiSlice'
import { toggleTheme } from '../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { FiMenu, FiSun, FiMoon, FiBell, FiSearch } from 'react-icons/fi'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, theme } = useSelector(state => state.auth)
  const { unreadCount } = useSelector(state => state.notifications)
  const isDark = theme === 'dark'

  return (
    <header className={`sticky top-0 z-10 flex items-center gap-4 px-4 md:px-6 py-3 border-b backdrop-blur-md ${
      isDark ? 'bg-dark-900/80 border-white/10 text-white' : 'bg-white/80 border-gray-200 shadow-sm text-gray-900'
    }`}>
      {/* Menu controls */}
      <button
        onClick={() => { dispatch(toggleSidebar()); dispatch(toggleMobileSidebar()) }}
        className={`p-2 rounded-lg transition-colors cursor-pointer ${ isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600' }`}
      >
        <FiMenu size={20} />
      </button>

      {/* Mock Search (looks premium and fits standard dashboards) */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search IPOs, accounts..."
          className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${
            isDark ? 'bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:border-brand/50' : 'bg-gray-100 text-gray-900 placeholder-gray-400 border border-transparent focus:border-brand'
          }`}
        />
      </div>

      {/* Header operations */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${ isDark ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-gray-100 text-gray-700' }`}
        >
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {/* Notifications badge */}
        <button 
          onClick={() => navigate('/notifications')} 
          className={`relative p-2 rounded-lg transition-colors cursor-pointer ${ isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600' }`}
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold shadow-sm">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {/* Avatar links */}
        <button 
          onClick={() => navigate('/profile')} 
          className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors cursor-pointer ${ isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100' }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className={`text-sm font-medium leading-none ${ isDark ? 'text-white' : 'text-gray-900' }`}>{user?.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </button>
      </div>
    </header>
  )
}
