import { createServer } from 'node:http'
import { Context, Service } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import Tools from '@deepseek-ai/dsh-tools'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { afterEach, expect, it } from 'vitest'
import DataJuicer from '../src/index.ts'
import { recipeFixture } from './http-fixture.ts'

const cleanups: Array<() => Promise<void>> = []
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup() })

async function fixture(options: Parameters<typeof recipeFixture>[0] = {}, maxResultBytes = 262_144) {
  const server = await recipeFixture(options)
  cleanups.push(server.close)
  const ctx = new Context()
  cleanups.push(async () => { await ctx.fiber.dispose() })
  new SystemPrompt(ctx, SystemPrompt.Config({}))
  new Tools(ctx)
  const api = new DataJuicer(ctx, DataJuicer.Config({ endpoint: server.endpoint, timeoutMs: 5000, maxResultBytes }))
  return { ctx, api, server }
}

it('verifies discovery before readiness and never exposes either execution tool', async () => {
  const { ctx, api, server } = await fixture()
  expect(ctx.tools.schemas().map(tool => tool.name)).toEqual(['data_juicer_discover'])
  const first = api.reconnect(), second = api.reconnect()
  expect(second).toBe(first)
  expect(api.status().phase).toBe('connecting')
  expect(await first).toMatchObject({ phase: 'ready' })
  expect(server.calls).toEqual(['get_global_config_schema', 'get_dataset_load_strategies', 'search_ops'])
  const signal = new AbortController().signal
  const result = await ctx.tools.execute({ name: 'data_juicer_discover', arguments: { operation: 'operators', query: 'text' }, callId: ToolCallId('discover'), signal })
  expect(result.isError).toBe(false)
  expect(result.content).toEqual([{ type: 'text', text: '{"metadata":"search_ops"}' }])
  const denied = await ctx.tools.execute({ name: 'data_juicer_discover', arguments: { operation: 'run_data_recipe' }, callId: ToolCallId('denied'), signal })
  expect(denied.isError).toBe(true)
  expect(server.calls).not.toContain('run_data_recipe')
  expect(server.calls).not.toContain('analyze_dataset')
})

it.each([
  { omit: 'run_data_recipe' }, { text: '{"error":"config parser failed"}' }, { isError: true },
])('reports incompatible or failing discovery as unavailable: %j', async (options) => {
  const { api } = await fixture(options)
  expect(await api.reconnect()).toMatchObject({ phase: 'unavailable', message: expect.stringContaining('retry') })
  await expect(api.discover('configuration', undefined, new AbortController().signal)).rejects.toThrow('unavailable')
})

it('rejects oversized metadata instead of claiming readiness', async () => {
  const { api } = await fixture({ text: '中文' }, 5)
  expect(await api.reconnect()).toMatchObject({ phase: 'unavailable', message: expect.stringContaining('maxResultBytes') })
})

it('unregisters tools and rejects further requests when its fiber unloads', async () => {
  const server = await recipeFixture(); cleanups.push(server.close)
  const ctx = new Context(); new SystemPrompt(ctx, SystemPrompt.Config({})); new Tools(ctx)
  cleanups.push(async () => { await ctx.fiber.dispose() })
  let api!: DataJuicer
  const child = ctx.plugin({ name: 'discovery-test', apply(inner: Context) {
    api = new DataJuicer(inner, DataJuicer.Config({ endpoint: server.endpoint }))
  } })
  await child
  await api.reconnect()
  await child.dispose()
  expect(ctx.tools.schemas()).toEqual([])
  expect(api.status().phase).toBe('closed')
  await expect(api.discover('loading', undefined, new AbortController().signal)).rejects.toThrow('closed')
})

it('rejects non-loopback configuration before registering tools', () => {
  const ctx = new Context(); new SystemPrompt(ctx, SystemPrompt.Config({})); new Tools(ctx)
  cleanups.push(async () => { await ctx.fiber.dispose() })
  expect(() => new DataJuicer(ctx, DataJuicer.Config({ endpoint: 'http://example.com/mcp' }))).toThrow('loopback')
  expect(ctx.tools.schemas()).toEqual([])
})

it('streams initial readiness and subsequent checks until the browser cancels', async () => {
  const { api } = await fixture()
  const lifetime = new AbortController()
  const iterator = api.follow(lifetime.signal)[Symbol.asyncIterator]()
  expect((await iterator.next()).value).toMatchObject({ phase: 'unavailable' })
  const next = iterator.next()
  await api.reconnect()
  expect((await next).value).toMatchObject({ phase: 'connecting' })
  expect((await iterator.next()).value).toMatchObject({ phase: 'ready' })
  const waiting = iterator.next()
  lifetime.abort()
  expect((await waiting).done).toBe(true)
})

it('rejects a cancelled discovery request and a missing operator query', async () => {
  const { api } = await fixture()
  await api.reconnect()
  await expect(api.discover('operators', undefined, new AbortController().signal)).rejects.toThrow('regular expression')
  await expect(api.discover('operators', ' ', new AbortController().signal)).rejects.toThrow('regular expression')
  await expect(api.discover('configuration', undefined, AbortSignal.abort(new Error('Cancelled')))).rejects.toThrow()
})

it('unloads while service initialization is waiting for the HTTP handshake', async () => {
  const requested = Promise.withResolvers<undefined>()
  const server = createServer(() => { requested.resolve(undefined) })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
  cleanups.push(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()) })
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Missing TCP address')
  const ctx = new Context(); new SystemPrompt(ctx, SystemPrompt.Config({})); new Tools(ctx)
  cleanups.push(async () => { await ctx.fiber.dispose() })
  let api!: DataJuicer
  const child = ctx.plugin({ name: 'pending-discovery', async apply(inner: Context) {
    api = new DataJuicer(inner, DataJuicer.Config({ endpoint: `http://127.0.0.1:${address.port}/mcp`, timeoutMs: 60_000 }))
    await api[Service.init]()
  } })
  await requested.promise
  await child.dispose()
  expect(api.status().phase).toBe('closed')
  expect(ctx.tools.schemas()).toEqual([])
})
