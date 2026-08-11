import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Explicit, serverless-safe bounds. Without these, a stalled connection or
// query waits indefinitely — confirmed in production as the scraper cron
// hanging for the full 300s Vercel function ceiling on every run (even ones
// with almost no backlog left), consistent with a hung DB call rather than
// real workload. Previous invocations were also SIGKILL'd by that same
// timeout without a clean pool teardown, which can leave Neon connections
// in a lingering state — a small pool + fail-fast timeouts keep that from
// snowballing into "every future run hangs too."
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 10_000, // give up acquiring a connection after 10s
  statement_timeout: 30_000,       // give up on a single query after 30s
  query_timeout: 30_000,
  max: 5,
})
const prisma = new PrismaClient({ adapter })

export default prisma
