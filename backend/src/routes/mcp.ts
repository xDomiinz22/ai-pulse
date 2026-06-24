import { Router, Request, Response } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpServer } from '../lib/mcpServer'

const router = Router()

// ── MCP endpoint (Streamable HTTP, stateless) ───────────────────────────────
// Every POST creates its own server + transport, fully isolated, then tears
// them down when the response closes. Stateless = no session IDs to track,
// which is the simplest mode and perfect for a read-only search tool.
router.post('/', async (req: Request, res: Response) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // undefined → stateless mode
  })

  res.on('close', () => {
    transport.close()
    server.close()
  })

  try {
    await server.connect(transport)
    // express.json() already parsed the body; hand it to the transport.
    await transport.handleRequest(req, res, req.body)
  } catch (err) {
    console.error('[mcp] error handling request:', (err as Error).message)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
})

// GET (server-push SSE) and DELETE (end session) only apply to stateful mode.
const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode.' },
    id: null,
  })
}
router.get('/', methodNotAllowed)
router.delete('/', methodNotAllowed)

export default router
