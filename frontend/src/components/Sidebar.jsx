import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { toggleSidebar } from '../redux/slices/uiSlice'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome, FiUsers, FiZap, FiCheckCircle, FiPieChart,
  FiFileText, FiBell, FiSettings, FiShield, FiLogOut, FiChevronLeft, FiMenu
} from 'react-icons/fi'

const navItems = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/accounts', icon: FiUsers, label: 'Saved Accounts' },
  { to: '/bulk-apply', icon: FiZap, label: 'Bulk Apply IPO' },
  { to: '/results', icon: FiCheckCircle, label: 'IPO Results' },
  { to: '/portfolio', icon: FiPieChart, label: 'Portfolio' },
  { to: '/reports', icon: FiFileText, label: 'Reports' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
]

export default function Sidebar() {
  const { sidebarOpen, sidebarMobileOpen } = useSelector(state => state.ui)
  const { user, theme } = useSelector(state => state.auth)
  const { unreadCount } = useSelector(state => state.notifications)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const isDark = theme === 'dark'

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const sidebarClass = `
    fixed lg:relative z-30 h-full flex flex-col transition-all duration-300
    ${isDark ? 'bg-dark-800 border-r border-white/10 text-white' : 'bg-white border-r border-gray-200 text-gray-900 shadow-xl'}
    ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}
    ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `

  return (
    <motion.aside className={sidebarClass} animate={{ width: sidebarOpen ? 260 : 72 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
      {/* Logo */}
      <div className={`flex items-center p-4 mb-2 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div key="full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center shadow-lg shadow-brand/30 flex-shrink-0">
                <span className="text-xl font-black text-white">B</span>
              </div>
              <div>
                <span className="text-xl font-black">Bulk<span className="text-gradient">IPO</span></span>
                <p className="text-[10px] text-gray-500 -mt-0.5">Nepal IPO Platform</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-white">B</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarOpen && (
          <button onClick={() => dispatch(toggleSidebar())} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <FiChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${!sidebarOpen ? 'justify-center px-0' : ''}`
          }>
            <div className="relative flex items-center">
              <Icon size={20} className="flex-shrink-0" />
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white shadow-sm">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <AnimatePresence>
              {sidebarOpen && <motion.span initial={{opacity:0,width:0}} animate={{opacity:1,width:'auto'}} exit={{opacity:0,width:0}} className="overflow-hidden whitespace-nowrap">{label}</motion.span>}
            </AnimatePresence>
          </NavLink>
        ))}

        <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'} my-3`} />

        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${!sidebarOpen ? 'justify-center px-0' : ''}`
          }>
            <FiShield size={20} />
            {sidebarOpen && <span>Admin Panel</span>}
          </NavLink>
        )}

        <NavLink to="/profile" className={({ isActive }) =>
          `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${!sidebarOpen ? 'justify-center px-0' : ''}`
        }>
          <FiSettings size={20} />
          {sidebarOpen && <span>Profile Settings</span>}
        </NavLink>
      </nav>

      {/* User info */}
      <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} p-2 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors group`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
              <FiLogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
