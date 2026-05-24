import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleMobileSidebar } from '../redux/slices/uiSlice'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardLayout() {
  const { sidebarMobileOpen } = useSelector(state => state.ui)
  const { theme } = useSelector(state => state.auth)
  const dispatch = useDispatch()

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-xs" onClick={() => dispatch(toggleMobileSidebar())} />
      )}
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Core main wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Scrollable contents */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="page-enter max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
