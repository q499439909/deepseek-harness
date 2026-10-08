/** Optional generated Remote and localized Plugins connection card. @module */
import type { Context } from '@deepseek-ai/cordis'
import remote from '@deepseek-ai/dsh-experimental-data-juicer/remote'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { RemoteStreamCarrierError } from '@deepseek-ai/dsh-api-gateway/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { DataJuicerStatus } from '@deepseek-ai/dsh-experimental-data-juicer/types'
import { ConnectionCard, type ConnectionInjected, type Readiness } from './ConnectionCard.tsx'
import { en, NS, zh } from './locales.ts'

/** Browser services required for this optional contribution. */
export const inject = ['remote', 'slots', 'locale']

/**
 * Mount connection observation and the existing bundle-detail extension point.
 * @param ctx - Client runtime owning the Remote, locale and slots.
 * @returns joined UI, stream, and Remote withdrawal.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const unmount = await ctx.remote.$mount(remote)
  const ui = ctx.inject(['remote.dataJuicer', 'slots', 'locale'], (inner) => {
    inner.effect(() => inner.locale.register(NS, { en, zh }))
    const state = createSnapshotStore<Readiness>({ status: null, connected: false, error: null })
    let disposed = false
    const fail = (error: unknown): void => {
      state.set({ ...state.getSnapshot(), connected: false, error: error instanceof Error ? error.message : String(error) })
    }
    const stream = inner.remote.$stream<DataJuicerStatus>({
      name: 'Data-Juicer readiness', open: signal => inner.remote.dataJuicer.follow(signal),
      ended: () => new RemoteStreamCarrierError('Data-Juicer readiness stream ended'), carrierFailed: fail,
    })
    const observing = (async () => {
      try {
        for await (const item of stream) {
          state.set({ status: item.value, connected: true, error: null })
          item.accept()
        }
      } catch (error) { if (!disposed) fail(error) }
    })()
    inner.effect(() => async () => { disposed = true; await stream.dispose(); await observing })
    const actions: ConnectionInjected = { hooks: { readiness: state }, retry: async () => {
      const result = await inner.remote.dataJuicer.reconnect()
      if (!result.ok) throw result.error
    } }
    inner.slots.inject('plugins.bundle.config', () => inner.slots.register({
      name: 'plugins.bundle.config', key: '@deepseek-ai/dsh-experimental-data-juicer-bundle',
      locale: NS, inject: () => actions,
    }, ConnectionCard))
  })
  try { await ui } catch (error) { await ui.dispose(); await unmount(); throw error }
  return async () => { await ui.dispose(); await unmount() }
}
