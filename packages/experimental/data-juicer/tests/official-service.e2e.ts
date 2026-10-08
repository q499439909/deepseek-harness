/** Opt-in compatibility checks against an operator-owned official recipe-flow service. */
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import Tools from '@deepseek-ai/dsh-tools'
import { expect, it } from 'vitest'
import DataJuicer from '../src/index.ts'

const endpoint = process.env.DSH_DATA_JUICER_TEST_ENDPOINT

it.skipIf(endpoint === undefined)('discovers configuration, loading strategies, and operator parameters through official HTTP', async () => {
  if (endpoint === undefined) throw new Error('Set DSH_DATA_JUICER_TEST_ENDPOINT')
  const ctx = new Context()
  try {
    new SystemPrompt(ctx, SystemPrompt.Config({}))
    new Tools(ctx)
    const api = new DataJuicer(ctx, DataJuicer.Config({ endpoint }))
    expect(await api.reconnect()).toMatchObject({ phase: 'ready' })
    const signal = new AbortController().signal
    const configuration: unknown = JSON.parse(await api.discover('configuration', undefined, signal))
    const loading: unknown = JSON.parse(await api.discover('loading', undefined, signal))
    const operators: unknown = JSON.parse(await api.discover('operators', 'text_length_filter', signal))
    expect(configuration).toEqual(expect.objectContaining({ project_name: expect.anything() }))
    expect(loading).toEqual(expect.any(Object))
    expect(Object.keys(loading ?? {})).not.toHaveLength(0)
    expect(operators).toEqual(expect.objectContaining({ text_length_filter: expect.anything() }))
    expect(ctx.tools.schemas().map(tool => tool.name)).toEqual(['data_juicer_discover'])
  } finally {
    await ctx.fiber.dispose()
  }
})
