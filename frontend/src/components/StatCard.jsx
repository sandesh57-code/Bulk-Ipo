import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend, index = 0 }) {
  const { theme } = useSelector(state => state.auth)
  const isDark = theme === 'dark'

  const colorMap = {
    brand: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'bg-indigo-500/20 text-indigo-400', glow: 'group-hover:shadow-indigo-500/10' },
    success: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', glow: 'group-hover:shadow-emerald-500/10' },
    warning: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'bg-amber-500/20 text-amber-400', glow: 'group-hover:shadow-amber-500/10' },
    danger: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: 'bg-red-500/20 text-red-400', glow: 'group-hover:shadow-red-500/10' },
    info: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'bg-blue-500/20 text-blue-400', glow: 'group-hover:shadow-blue-500/10' },
    purple: { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'bg-purple-500/20 text-purple-400', glow: 'group-hover:shadow-purple-500/10' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`group card p-6 cursor-pointer ${ 
        isDark ? 'card-dark hover:bg-dark-800' : 'card-light hover:bg-gray-50' 
      } border-l-4 border-l-indigo-500/80 shadow-xs`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-3xl font-extrabold tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${c.icon}`}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1 mt-4 text-xs font-semibold">
          <span className={trend.isPositive ? 'text-emerald-400' : 'text-red-400'}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500">{trend.label || 'since last month'}</span>
        </div>
      )}
    </motion.div>
  )
}
