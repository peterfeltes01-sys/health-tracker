import { Coins, TrendingUp } from 'lucide-react'

interface PointBalanceCardProps {
  totalPoints: number
  pointBalance: number
  canApplyBalance: boolean
  onApplyBalance: () => void
}

export function PointBalanceCard({
  totalPoints,
  pointBalance,
  canApplyBalance,
  onApplyBalance,
}: PointBalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} />
        <span className="text-sm font-semibold opacity-90">Punkte</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-4xl font-black">{totalPoints.toLocaleString('de')}</div>
          <div className="text-xs opacity-75 mt-0.5">Gesamtpunkte</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Coins size={14} className="opacity-75" />
            <span className="text-xl font-bold">{pointBalance}</span>
          </div>
          <div className="text-[10px] opacity-75">Guthaben</div>
        </div>
      </div>

      {canApplyBalance && pointBalance > 0 && (
        <button
          onClick={onApplyBalance}
          className="mt-3 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-bold transition-colors"
        >
          Mit Guthaben ausgleichen
        </button>
      )}
    </div>
  )
}
