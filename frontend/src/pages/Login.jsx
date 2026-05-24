import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginUser, clearError } from '../redux/slices/authSlice'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated } = useSelector(state => state.auth)

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      return toast.error('Please enter all fields')
    }
    dispatch(loginUser({ email, password }))
  }

  return (
    <div className="bg-dark-800/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-white">Welcome Back</h2>
        <p className="text-gray-400 text-sm mt-1">Sign in to manage your MeroShare portfolios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark pl-11"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs text-brand hover:underline font-medium">Forgot Password?</Link>
          </div>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark pl-11 pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-sm border-white/10 bg-dark-700 text-brand focus:ring-brand focus:ring-2 focus:ring-offset-dark-900 focus:outline-none"
          />
          <label htmlFor="remember-me" className="ml-2.5 text-sm text-gray-300 cursor-pointer">Remember this device</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 font-semibold cursor-pointer shadow-lg shadow-brand/20 hover:shadow-brand/40"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6 text-sm text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand hover:underline font-semibold">Create account</Link>
      </div>
    </div>
  )
}
