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

  const printResult = (result: unknown) => {
    const blocks = ((result as { content?: unknown }).content ?? []) as Array<{ type: string; text?: string }>
    for (const block of blocks) {
      if (block.type === 'text') console.log(block.text)
    }
  }

  const query = process.argv[2] || 'OpenAI'
  console.log(`\n📞 search_articles({ query: "${query}" })`)
  printResult(await client.callTool({ name: 'search_articles', arguments: { query } }))

  console.log('\n📞 get_trending({ limit: 3 })')
  printResult(await client.callTool({ name: 'get_trending', arguments: { limit: 3 } }))

  console.log('\n📞 list_recent({ category: "research", limit: 3 })')
  printResult(await client.callTool({ name: 'list_recent', arguments: { category: 'research', limit: 3 } }))

  // Chain: take a URL from the search results and ask for related articles.
  const firstSearch = await client.callTool({ name: 'search_articles', arguments: { query } })
  const firstText = ((firstSearch as { content?: Array<{ text?: string }> }).content?.[0]?.text) ?? ''
  const sampleUrl = firstText.match(/https?:\/\/\S+/)?.[0]
  if (sampleUrl) {
    console.log(`\n📞 get_related({ url: "${sampleUrl}", limit: 3 })`)
    printResult(await client.callTool({ name: 'get_related', arguments: { url: sampleUrl, limit: 3 } }))
  }

  await client.close()
}

main().catch(err => { console.error(err); process.exit(1) })
