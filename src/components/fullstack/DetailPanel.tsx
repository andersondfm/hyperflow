import { Cloud, Sparkles } from 'lucide-react'
import {
  CLOUD_LABEL,
  CloudProviders,
  PIPELINE_STEPS,
  PROFILE,
  RUNTIME_LAYERS,
} from '@/data/fullstackProfile'
import { useDeliveryStore } from '@/store/deliveryStore'
import { cn } from '@/lib/utils'

const DEMO_SCRIPT: readonly string[] = [
  'GET /' + PROFILE.resource + ' — cache frio, cai no read model',
  'GET de novo — Redis HIT, latência despenca',
  'POST — domínio valida, SQL Server confirma, evento projeta no Mongo',
  'Abrir Pull Request — o quality gate reprova',
  'Escrever teste primeiro (TDD) — rodar de novo, deploy sai',
]

export function DetailPanel() {
  const selectedId = useDeliveryStore((s) => s.selectedId)
  const cloud = useDeliveryStore((s) => s.cloud)
  const logs = useDeliveryStore((s) => s.logs)

  const layer = RUNTIME_LAYERS.find((item) => item.id === selectedId)
  const step = PIPELINE_STEPS.find((item) => item.id === selectedId)

  const title = layer?.title ?? step?.title ?? null
  const subtitle = layer ? `${layer.layer} · ${layer.tech}` : (step?.subtitle ?? null)
  const bullets = layer?.bullets ?? step?.bullets ?? null
  const tags = layer?.tags ?? step?.tags ?? null
  const cloudLine = layer?.cloud[cloud] ?? step?.cloud[cloud] ?? null

  return (
    <aside className="flex h-56 shrink-0 flex-col border-t border-slate-800 bg-slate-950/90 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {title ? 'Camada selecionada' : 'Roteiro'}
        </p>
        <h2 className="mt-0.5 font-display text-sm font-semibold text-slate-100">
          {title ?? 'Demo em 2 minutos'}
        </h2>
        {subtitle && (
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{subtitle}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {title ? (
          <div className="space-y-3">
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <ul className="space-y-1.5">
              {bullets?.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-[11px] leading-snug text-slate-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                  {bullet}
                </li>
              ))}
            </ul>

            {cloudLine && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Cloud className="h-3 w-3 text-slate-500" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    Na {CLOUD_LABEL[cloud]}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-200">{cloudLine}</p>
                <p className="mt-1 font-mono text-[9px] text-slate-600">
                  Mesma ideia na{' '}
                  {cloud === CloudProviders.Azure
                    ? CLOUD_LABEL[CloudProviders.Aws]
                    : CLOUD_LABEL[CloudProviders.Azure]}
                  — muda o nome do serviço
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Ordem dos cliques
              </p>
            </div>
            <ol className="space-y-1.5">
              {DEMO_SCRIPT.map((line, index) => (
                <li key={line} className="flex gap-2 text-[11px] leading-snug text-slate-300">
                  <span className="font-mono text-[10px] font-semibold text-cyan-300">
                    {index + 1}.
                  </span>
                  {line}
                </li>
              ))}
            </ol>
            <p className="text-[11px] leading-snug text-slate-500">
              Clique em qualquer card para ver a decisão técnica daquela camada e o serviço
              equivalente na nuvem.
            </p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Event log
          </p>
          <span className="font-mono text-[9px] text-slate-600">{logs.length}</span>
        </div>
        <div className="h-full space-y-1 overflow-y-auto px-3 pb-3">
          {logs.length === 0 && (
            <p className="font-mono text-[10px] text-slate-600">Aguardando o primeiro request…</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-1.5 font-mono text-[10px] leading-snug">
              <span
                className={cn(
                  'shrink-0 font-semibold uppercase',
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                      ? 'text-amber-300'
                      : log.level === 'success'
                        ? 'text-emerald-300'
                        : 'text-slate-500',
                )}
              >
                {log.source}
              </span>
              <span className="text-slate-400">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
