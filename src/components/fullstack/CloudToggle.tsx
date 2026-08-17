import {
  CLOUD_LABEL,
  CLOUD_SHORT,
  CloudProviders,
  type CloudProvider,
} from '@/data/fullstackProfile'
import { useDeliveryStore } from '@/store/deliveryStore'
import { cn } from '@/lib/utils'

const OPTIONS: readonly CloudProvider[] = [
  CloudProviders.Azure,
  CloudProviders.Aws,
  CloudProviders.DigitalOcean,
]

export function CloudToggle() {
  const cloud = useDeliveryStore((s) => s.cloud)
  const setCloud = useDeliveryStore((s) => s.setCloud)

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5">
      <span className="px-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        Nuvem
      </span>
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setCloud(option)}
          title={CLOUD_LABEL[option]}
          className={cn(
            'rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition',
            cloud === option
              ? 'bg-sky-400 text-slate-950'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
          )}
        >
          {CLOUD_SHORT[option]}
        </button>
      ))}
    </div>
  )
}
