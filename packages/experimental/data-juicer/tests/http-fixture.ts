/** Loopback recipe-flow metadata fixture with wire-level invocation observations. */
import { createServer } from 'node:http'
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { toNodeHandler, type NodeIncomingMessageLike } from '@modelcontextprotocol/node'
import { z } from 'zod'

/**
 * Bind an isolated HTTP server with the official five-tool vocabulary.
 * @param options - fixture-owned metadata and missing-tool fault injection.
 * @returns endpoint, observed calls, and quiescent cleanup.
 */
export async function recipeFixture(options: { text?: string; omit?: string; isError?: boolean } = {}) {
  const calls: string[] = []
  const handler = createMcpHandler(() => {
    const mcp = new McpServer({ name: 'recipe-flow-fixture', version: '1.0.0' })
    for (const name of ['get_global_config_schema', 'get_dataset_load_strategies', 'search_ops', 'run_data_recipe', 'analyze_dataset']) {
      if (name === options.omit) continue
      mcp.registerTool(name, { inputSchema: z.object({ query: z.string().optional(), search_mode: z.string().optional() }) }, async () => {
        calls.push(name)
        return { content: [{ type: 'text' as const, text: options.text ?? JSON.stringify({ metadata: name }) }], isError: options.isError ?? false }
      })
    }
    return mcp
  })
  const handle = toNodeHandler(handler)
  const server = createServer((request, response) => {
    void handle(request as NodeIncomingMessageLike, response).catch((error) => { response.writeHead(500).end(String(error)) })
  })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Missing TCP address')
  return {
    endpoint: `http://127.0.0.1:${address.port}/mcp`, calls,
    async close(): Promise<void> {
      await handler.close()
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => { server.close((error) => { if (error) reject(error); else resolve() }) })
    },
  }
}
