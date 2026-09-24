import { useState } from 'react'
import { Boxes, RotateCcw } from 'lucide-react'
import {
  LIFETIME_GUIDES,
  Lifetimes,
  OTHER_REGISTRATIONS,
  type Lifetime,
} from '@/data/dotnetLifetimes'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { cn } from '@/lib/utils'

const TONE: Record<Lifetime, string> = {
  [Lifetimes.Transient]: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  [Lifetimes.Scoped]: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  [Lifetimes.Singleton]: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
}

export function LifetimesLayout() {
  const [selected, setSelected] = useState<Lifetime>(Lifetimes.Scoped)
  const guide = LIFETIME_GUIDES.find((item) => item.id === selected) ?? LIFETIME_GUIDES[1]

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400 text-slate-950">
            <Boxes className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold text-slate-50">
              HyperFlow · DI no .NET 9
            </h1>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">
              Transient, Scoped e Singleton na API REST
            </p>
          </div>
        </div>
        <ViewTabs />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
          <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-slate-300">
            Monólito e microsserviço usam os mesmos três lifetimes. Não existe um “melhor para microserviço”. O que muda é o processo: no monólito o Singleton é da aplicação inteira; no microsserviço ele é só daquele serviço.
          </p>

          <div className="mb-4 grid gap-2 md:grid-cols-2">
            <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Monólito</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-300">
                Uma API, um processo. O handler e o DbContext continuam Scoped, um por request. O Singleton do Redis e do cache vale para todos os módulos. Se um módulo guarda estado ali, o outro vê.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Microsserviço</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-300">
                Cada serviço é um processo. O Scoped continua sendo a request daquele serviço. O Singleton não atravessa a rede: o cache do serviço de pedidos não é o cache do serviço de estoque.
              </p>
            </article>
          </div>

          <p className="mb-3 text-[13px] leading-snug text-slate-400">
            Na API REST, o padrão é Scoped. Singleton só para infraestrutura do processo. Transient só para objeto sem estado e barato de criar.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {LIFETIME_GUIDES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition',
                  selected === item.id ? TONE[item.id] : 'border-slate-800 bg-slate-900/40 text-slate-300',
                )}
              >
                <span className="font-display text-sm font-semibold">{item.title}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{item.rule}</span>
              </button>
            ))}
          </div>

          {guide && (
            <section className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                A mesma classe, resolvida três vezes
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <RequestBox title="Request A" chips={[guide.instances[0], guide.instances[1]]} note="duas injeções no mesmo request" />
                <RequestBox title="Request B" chips={[guide.instances[2]]} note="o request seguinte" />
              </div>
              <p className="mt-3 text-[12px] leading-snug text-slate-400">
                {guide.id === Lifetimes.Transient && 'Cada injeção ganha um número novo. Nem dentro do mesmo request elas se encontram.'}
                {guide.id === Lifetimes.Scoped && 'Dentro da request A as duas injeções são o mesmo objeto. A request B recebe outro. É assim que o DbContext funciona.'}
                {guide.id === Lifetimes.Singleton && 'As três resoluções devolvem o mesmo objeto. Request A e request B compartilham. Por isso não pode ter estado de usuário.'}
              </p>
            </section>
          )}

          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Outros registros que convivem com os três
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {OTHER_REGISTRATIONS.map((item) => (
                <article key={item.title} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                  <h2 className="font-display text-sm font-semibold text-slate-100">{item.title}</h2>
                  <p className="mt-1 text-[12px] leading-snug text-slate-400">{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        {guide && (
          <aside className="flex h-80 shrink-0 flex-col overflow-y-auto border-t border-slate-800 bg-slate-950/90 p-4 lg:h-auto lg:w-96 lg:border-l lg:border-t-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Onde eu uso na API</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-50">{guide.title}</h2>
            <ul className="mt-3 space-y-2">
              {guide.where.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] leading-snug text-slate-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                  {line}
                </li>
              ))}
            </ul>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-cyan-100">
              {guide.register}
            </pre>
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] leading-snug text-rose-100">
              Recusei: {guide.refused}
            </p>
            <ul className="mt-3 space-y-2">
              {guide.because.map((line) => (
                <li key={line} className="flex gap-2 text-[12px] leading-snug text-slate-400">
                  <RotateCcw className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                  {line}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}

function RequestBox({
  title,
  chips,
  note,
}: {
  title: string
  chips: readonly string[]
  note: string
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2 flex gap-2">
        {chips.map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm font-semibold text-slate-100"
          >
            {chip}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </div>
  )
}
