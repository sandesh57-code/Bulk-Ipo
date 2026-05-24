import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiHome, FiAlertCircle } from 'react-icons/fi'

export default function NotFound() {
  const { theme } = useSelector(state => state.auth)
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      isDark ? 'bg-dark-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`card p-10 text-center max-w-md w-full shadow-2xl border ${
        isDark ? 'card-dark bg-dark-800/60' : 'card-light bg-white'
      }`}>
        <div className="flex justify-center text-brand mb-4">
          <FiAlertCircle size={64} className="animate-pulse" />
        </div>
        <h1 className="text-3xl font-black">404</h1>
        <h2 className="text-xl font-bold mt-2">Page Not Found</h2>
        <p className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          The page you are looking for doesn't exist or has been moved to another section.
        </p>
        <Link 
          to="/dashboard" 
          className="btn-primary mt-8 mx-auto justify-center font-semibold cursor-pointer w-full py-3"
        >
          <FiHome size={18} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
