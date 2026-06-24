import 'dotenv/config'
import prisma from '../lib/prisma'
import { runAgent, ModelBusyError } from '../lib/agent'

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'

async function main() {
  const question = process.argv[2] || 'What has OpenAI been doing recently?'
  console.log(`\n❓ Question: ${question}  (model: ${CHAT_MODEL})`)

  try {
    const answer = await runAgent(question)
    console.log('\n💬 Final answer:\n')
    console.log(answer)
  } catch (err) {
    if (err instanceof ModelBusyError) {
      console.error(`\n⚠️  ${err.message}`)
    } else {
      throw err
    }
  }
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
