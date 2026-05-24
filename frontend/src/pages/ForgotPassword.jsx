import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiCheckCircle } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')

    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      toast.success(data.message)
      if (data.otp) {
        setOtp(data.otp) // Show OTP in UI for development ease
      }
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark-800/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-white">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black">Reset Password</h2>
        <p className="text-gray-400 text-sm mt-1">We'll send you an OTP to reset your password</p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-semibold cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Send Reset OTP'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 text-center">
          <div className="flex justify-center text-emerald-400 mb-2">
            <FiCheckCircle size={56} />
          </div>
          <h3 className="text-lg font-bold">OTP Sent Successfully!</h3>
          <p className="text-sm text-gray-400">
            A password reset request code has been generated. For testing convenience, your OTP is:
          </p>
          <div className="bg-brand/20 text-brand text-2xl font-black tracking-widest py-3 px-6 rounded-lg inline-block">
            {otp || '123456'}
          </div>
          <p className="text-xs text-gray-500">
            Copy this OTP and use it to change your credentials.
          </p>

          <Link to="/login" className="w-full btn-secondary py-3 block font-semibold cursor-pointer">
            Back to Sign In
          </Link>
        </div>
      )}

      <div className="mt-8 text-center border-t border-white/5 pt-6 text-sm text-gray-400">
        Already remembered your password?{' '}
        <Link to="/login" className="text-brand hover:underline font-semibold">Sign In</Link>
      </div>
    </div>
  )
}
