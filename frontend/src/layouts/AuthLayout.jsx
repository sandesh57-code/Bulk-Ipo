import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  const { isAuthenticated } = useSelector(state => state.auth)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-dark-900 flex text-white font-sans">
      {/* Left side - Branding (Only visible on large screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-800 via-dark-900 to-black items-center justify-center relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay:'1.5s'}} />
        </div>
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8}}>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center shadow-2xl shadow-brand/40">
                <span className="text-3xl font-black text-white">B</span>
              </div>
              <span className="text-4xl font-black text-white">Bulk<span className="text-gradient">IPO</span></span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Nepal's #1 IPO Management Platform</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto">Apply to multiple IPOs across all your MeroShare accounts in a single click. Track results, manage portfolios, and never miss an IPO again.</p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[{label:'Accounts', value:'500+'},{label:'IPOs Applied', value:'10K+'},{label:'Success Rate', value:'99.9%'}].map(stat => (
                <div key={stat.label} className="glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-dark-900">
        <motion.div className="w-full max-w-md" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:0.6}}>
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
