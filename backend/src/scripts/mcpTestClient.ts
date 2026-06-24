import 'dotenv/config'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

// Connects to our own MCP server as a real client would, then lists and calls
// the search_articles tool — proving the end-to-end protocol works.

const ENDPOINT = process.env.MCP_URL || 'http://localhost:3001/api/mcp'

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT))
  const client = new Client({ name: 'mcp-test-client', version: '1.0.0' })

  console.log(`\n🔌 Connecting to ${ENDPOINT} ...`)
  await client.connect(transport)
  console.log('✅ Connected (initialize handshake done)')

  const tools = await client.listTools()
  console.log(`\n🧰 tools/list → ${tools.tools.map(t => t.name).join(', ')}`)

  const query = process.argv[2] || 'OpenAI'
  console.log(`\n📞 tools/call search_articles({ query: "${query}" })`)
  const result = await client.callTool({
    name: 'search_articles',
    arguments: { query },
  })

  console.log('\n📄 Result:\n')
  for (const block of result.content as Array<{ type: string; text?: string }>) {
    if (block.type === 'text') console.log(block.text)
  }

  await client.close()
}

main().catch(err => { console.error(err); process.exit(1) })
