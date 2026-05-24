import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markAsRead, markAllRead } from '../redux/slices/notificationSlice'
import { FiBell, FiCheck, FiCheckSquare, FiAlertCircle, FiInfo, FiTrash } from 'react-icons/fi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Notifications() {
  const dispatch = useDispatch()
  
  const { theme } = useSelector(state => state.auth)
  const { notifications, loading } = useSelector(state => state.notifications)
  const isDark = theme === 'dark'

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id))
  }

  const handleMarkAllRead = () => {
    dispatch(markAllRead())
      .unwrap()
      .then(() => toast.success('All notifications marked as read'))
  }

  const getIcon = (type) => {
    switch (type) {
      case 'application_success':
      case 'ipo_result':
        return <FiCheckCircle className="text-emerald-400" size={20} />
      case 'application_failure':
        return <FiAlertCircle className="text-red-400" size={20} />
      default:
        return <FiInfo className="text-brand" size={20} />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Notifications</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stay updated with IPO results and submission updates</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <FiCheckSquare size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(n => (
            <div 
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`card p-5 border flex gap-4 cursor-pointer transition-all duration-200 relative group ${
                n.isRead 
                  ? isDark 
                    ? 'card-dark bg-dark-800/30 border-white/5 opacity-70' 
                    : 'card-light bg-white border-gray-150 opacity-70'
                  : isDark
                    ? 'card-dark bg-dark-800/80 border-brand/30 hover:border-brand/60'
                    : 'card-light bg-indigo-50/10 border-brand/30 hover:border-brand/60 shadow-md'
              }`}
            >
              {/* Unread circle badge */}
              {!n.isRead && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand" />
              )}

              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5 ml-2">
                {getIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <h4 className={`font-bold text-sm sm:text-base ${n.isRead ? 'text-gray-400' : 'text-white'}`}>{n.title}</h4>
                <p className={`text-xs sm:text-sm ${n.isRead ? 'text-gray-500' : 'text-gray-300'}`}>{n.message}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {format(new Date(n.createdAt), 'PPp')}
                </p>
              </div>

              {/* Actions */}
              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkRead(n._id)
                  }}
                  className="p-1 rounded-md text-gray-500 hover:text-emerald-400 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Mark as read"
                >
                  <FiCheck size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`card p-12 text-center ${isDark ? 'card-dark bg-dark-800/40' : 'card-light bg-white'}`}>
          <div className="flex justify-center text-brand mb-4">
            <FiBell size={56} className="animate-bounce" />
          </div>
          <h2 className="text-xl font-bold">No Notifications</h2>
          <p className={`text-sm mt-2 max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            You are all caught up! When you apply for IPOs or allotment results publish, updates appear here.
          </p>
        </div>
      )}
    </div>
  )
}
const FiCheckCircle = ({ className, size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)
