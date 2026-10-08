/** Connection readiness displayed inside the existing Plugins detail page. @module */
import { useState } from 'react'
import { Button, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { DataJuicerStatus } from '@deepseek-ai/dsh-experimental-data-juicer/types'
import { NS } from './locales.ts'
import css from './ConnectionCard.module.css'

/** Host state with transport health tracked separately. */
export interface Readiness {
  readonly status: DataJuicerStatus | null
  readonly connected: boolean
  readonly error: string | null
}

/** Registration-side data and actions; the renderer synthesizes the observation hook. */
export interface ConnectionInjected {
  readonly hooks: { readonly readiness: ObservableSnapshot<Readiness> }
  readonly retry: () => Promise<void>
}

/** Props derived from locale and framework injection seats. */
export type ConnectionProps = InjectFace<ConnectionInjected> & PropsLocale<typeof NS>

/** Render verified connection health and a retry action without initiating model work. */
export function ConnectionCard({ useReadiness, retry, t }: ConnectionProps) {
  const view = useReadiness(value => value)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = view.status
  const checking = pending || status?.phase === 'connecting'
  const run = async (): Promise<void> => {
    setPending(true); setError(null)
    try { await retry() } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) }
    finally { setPending(false) }
  }
  const diagnostic = error ?? view.error ?? status?.message
  return <section className={css.card}>
    <p>{t('setup')}</p>
    <p>{t('discoveryOnly')}</p>
    {status && <dl><dt>{t('endpoint')}</dt><dd>{status.endpoint}</dd></dl>}
    <div className={css.readiness} role="status">
      <StateDot state={!view.connected ? 'error' : status?.phase === 'ready' ? 'done' : checking ? 'ongoing' : 'error'} />
      <span>{!view.connected || !status ? t('disconnected') : t(`phase.${status.phase}`)}</span>
    </div>
    <Button variant="outline" size="sm" disabled={!view.connected || checking} onClick={() => { void run() }}>{t('retry')}</Button>
    {diagnostic && <details><summary>{t('details')}</summary><pre>{diagnostic}</pre></details>}
  </section>
}
