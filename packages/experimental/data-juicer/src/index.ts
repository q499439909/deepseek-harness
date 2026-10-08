/** Private recipe-flow HTTP connection with read-only discovery consumers. @module */
import { Context, Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { assertNever } from '@deepseek-ai/dsh-util-values'
import type { DataJuicerStatus, DiscoveryOperation } from './types.ts'

export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Private Data-Juicer discovery connection. */
    dataJuicer: DataJuicer
  }
}

/** Same-host endpoint and deployment-owned request/result limits. */
export interface Config {
  /** Loopback recipe-flow MCP URL. */
  endpoint: string
  /** Deadline for each HTTP request and metadata tool call. */
  timeoutMs: number
  /** Maximum UTF-8 bytes returned by one metadata operation. */
  maxResultBytes: number
}

const DISCOVERY = {
  configuration: 'get_global_config_schema',
  loading: 'get_dataset_load_strategies',
  operators: 'search_ops',
} as const

function endpointOf(value: string): URL {
  const url = new URL(value)
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
    || url.username || url.password || url.hash) {
    throw new Error('Data-Juicer requires an HTTP loopback endpoint without credentials or a fragment')
  }
  return url
}

/** Metadata service and authenticated Web readiness Remote; processing is not exposed. */
export default class DataJuicer extends TypertRemoteService {
  static inject = ['tools', 'typert']
  static Config = z.object({
    endpoint: z.string().default('http://127.0.0.1:8080/mcp'),
    timeoutMs: z.number().step(1).min(1).max(2_147_483_647).default(60_000),
    maxResultBytes: z.number().step(1).min(1).default(262_144),
  })

  private readonly lifetime = new AbortController()
  private readonly pending = new Set<Promise<unknown>>()
  private client: Client | undefined
  private connection: Promise<DataJuicerStatus> | undefined
  private stopping: Promise<void> | undefined
  private state: DataJuicerStatus
  private readonly observers = new Set<() => void>()

  constructor(ctx: Context, private readonly config: Config) {
    endpointOf(config.endpoint)
    super(ctx, 'dataJuicer', { namespace: 'dataJuicer' })
    this.state = { phase: 'unavailable', endpoint: config.endpoint }
    ctx.tools.register(defineTool({
      name: 'data_juicer_discover',
      description: 'Discover data-processing configuration, loading strategies, or operators and their parameters. This only reads metadata; it does not process or analyze a dataset.',
      parameters: {
        operation: { type: 'string', enum: ['configuration', 'loading', 'operators'], required: true },
        query: { type: 'string', description: 'Operator-name regular expression; only used for operators.' },
      },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      execute: (args, execution) => this.discover(args.operation, args.query, execution.signal),
    }))
    // Cordis announces unload before waiting for an unfinished service initialization.
    ctx.on('internal/plugin', (fiber) => {
      if (fiber === ctx.fiber && fiber.uid === null) this.abort()
    }, { global: true })
    ctx.effect(() => () => this.stop())
  }

  private abort(): void {
    this.lifetime.abort(new Error('Data-Juicer integration closed'))
    this.changed({ phase: 'closed', endpoint: this.config.endpoint })
  }

  private stop(): Promise<void> {
    return this.stopping ??= this.close()
  }

  private async close(): Promise<void> {
    this.abort()
    try { await this.client?.close() } finally {
      await Promise.allSettled(this.pending)
      this.client = undefined
    }
  }

  async [Service.init](): Promise<void> { await this.reconnect() }

  /**
   * Read the connection observation without contacting the service.
   * @returns detached last verified readiness or explicit unavailability.
   */
  @Remote
  status(): DataJuicerStatus { return { ...this.state } }

  /**
   * Observe connection changes without adding messages to any Session.
   * @param signal - browser observation lifetime.
   * @returns initial and subsequent complete connection observations.
   */
  @Remote({ mode: 'stream' })
  async *follow(signal: AbortSignal): AsyncIterable<DataJuicerStatus> {
    const lifetime = AbortSignal.any([signal, this.lifetime.signal])
    let wake = Promise.withResolvers<void>()
    let dirty = true
    const notify = (): void => { dirty = true; wake.resolve() }
    this.observers.add(notify)
    lifetime.addEventListener('abort', notify, { once: true })
    try {
      while (!lifetime.aborted) {
        if (!dirty) await wake.promise
        if (lifetime.aborted) break
        wake = Promise.withResolvers<void>(); dirty = false
        yield this.status()
      }
    } finally {
      this.observers.delete(notify)
      lifetime.removeEventListener('abort', notify)
    }
  }

  private changed(state: DataJuicerStatus): void {
    this.state = state
    for (const observer of this.observers) observer()
  }

  /**
   * Retry connection and metadata checks; concurrent requests join one attempt.
   * @returns verified readiness or the failed attempt's diagnostic.
   */
  @Remote
  reconnect(): Promise<DataJuicerStatus> {
    this.lifetime.signal.throwIfAborted()
    if (this.connection !== undefined) return this.connection
    const attempt = this.open()
    this.connection = attempt
    this.pending.add(attempt)
    const settled = (): void => { this.pending.delete(attempt); this.connection = undefined }
    void attempt.then(settled, settled)
    return attempt
  }

  private async open(): Promise<DataJuicerStatus> {
    this.changed({ phase: 'connecting', endpoint: this.config.endpoint })
    const previous = this.client
    const client = new Client({ name: 'dsh-data-juicer', version: '0.2.1-alpha.1' }, {
      capabilities: {}, versionNegotiation: { mode: 'auto' },
    })
    this.client = client
    client.onclose = () => {
      if (this.client === client && this.state.phase === 'ready') {
        this.changed({ phase: 'unavailable', endpoint: this.config.endpoint, message: 'Connection closed. Start recipe-flow and retry.' })
      }
    }
    const transport = new StreamableHTTPClientTransport(endpointOf(this.config.endpoint), {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([
        this.lifetime.signal, AbortSignal.timeout(this.config.timeoutMs), ...init?.signal ? [init.signal] : [],
      ]) }),
    })
    try {
      await previous?.close()
      this.lifetime.signal.throwIfAborted()
      await client.connect(transport, { signal: this.lifetime.signal, timeout: this.config.timeoutMs })
      const tools = await client.listTools(undefined, { signal: this.lifetime.signal, timeout: this.config.timeoutMs })
      for (const name of [...Object.values(DISCOVERY), 'run_data_recipe', 'analyze_dataset']) {
        if (!tools.tools.some(tool => tool.name === name)) throw new Error(`recipe-flow is missing tool: ${name}`)
      }
      await this.query(client, 'configuration', undefined, this.lifetime.signal)
      await this.query(client, 'loading', undefined, this.lifetime.signal)
      await this.query(client, 'operators', 'text_length_filter', this.lifetime.signal)
      this.lifetime.signal.throwIfAborted()
      this.changed({ phase: 'ready', endpoint: this.config.endpoint })
    } catch (error) {
      const cleanup = await Promise.allSettled([client.close(), transport.close()])
      this.client = undefined
      if (!this.lifetime.signal.aborted) {
        const failures = cleanup.flatMap(result => result.status === 'rejected' ? [String(result.reason)] : [])
        this.changed({ phase: 'unavailable', endpoint: this.config.endpoint,
          message: `Start a compatible Data-Juicer recipe-flow service and retry: ${error instanceof Error ? error.message : String(error)}${failures.length ? `; connection cleanup: ${failures.join('; ')}` : ''}` })
      }
    }
    return this.status()
  }

  /**
   * Read bounded metadata through the closed discovery vocabulary.
   * @param operation - configuration, loading, or operator metadata.
   * @param query - optional operator-name regular expression.
   * @param signal - requesting tool's cancellation lifetime.
   * @returns upstream metadata text, with reported errors rejected.
   */
  async discover(operation: DiscoveryOperation, query: string | undefined, signal: AbortSignal): Promise<string> {
    this.lifetime.signal.throwIfAborted()
    const client = this.client
    if (this.state.phase !== 'ready' || client === undefined) throw new Error('Data-Juicer is unavailable. Start recipe-flow and retry the connection.')
    const request = this.query(client, operation, query, AbortSignal.any([signal, this.lifetime.signal]))
    this.pending.add(request)
    try { return await request } finally { this.pending.delete(request) }
  }

  private async query(client: Client, operation: DiscoveryOperation, query: string | undefined, signal: AbortSignal): Promise<string> {
    let args: Record<string, unknown>
    switch (operation) {
      case 'configuration': case 'loading': args = {}; break
      case 'operators':
        if (query === undefined || query.trim() === '') throw new Error('Provide an operator-name regular expression')
        args = { search_mode: 'regex', query }; break
      default: return assertNever(operation)
    }
    const result = await client.callTool({ name: DISCOVERY[operation], arguments: args }, { signal, timeout: this.config.timeoutMs })
    const text = result.content.map((block) => {
      if (block.type !== 'text') throw new Error('Data-Juicer metadata must be text')
      return block.text
    }).join('\n')
    if (Buffer.byteLength(text) > this.config.maxResultBytes) throw new Error('Data-Juicer metadata exceeds maxResultBytes; narrow the operator query or increase the configured limit')
    if (result.isError) throw new Error(text)
    for (const block of result.content) {
      if (block.type !== 'text') continue
      let value: unknown
      try { value = JSON.parse(block.text) } catch (_error) { continue }
      if (typeof value === 'object' && value !== null && 'error' in value) throw new Error(String(value.error))
    }
    return text
  }
}
