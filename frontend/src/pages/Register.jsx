import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, clearError } from '../redux/slices/authSlice'
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all required fields')
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }

    dispatch(registerUser({ name, email, phone, password }))
  }

  return (
    <div className="bg-dark-800/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-white">Create Account</h2>
        <p className="text-gray-400 text-sm mt-1">Start applying to IPOs in bulk</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark pl-11"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
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

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Phone (Optional)</label>
          <div className="relative">
            <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-dark pl-11"
              placeholder="98XXXXXXXX"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark pl-11 pr-11"
              placeholder="Min. 6 characters"
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

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-dark pl-11"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 mt-4 font-semibold cursor-pointer shadow-lg shadow-brand/20 hover:shadow-brand/40"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-white/5 pt-5 text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand hover:underline font-semibold">Sign In</Link>
      </div>
    </div>
  )
}
