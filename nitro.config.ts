import { defineNitroConfig } from 'nitro/config'

// ISR replaces the previous pure-SSR "/" route. The scraper only ingests new
// articles once an hour, so re-rendering on every single request is wasted
// work: this way Vercel's CDN serves the cached HTML directly (no function
// invocation, no cold-start risk) and only regenerates in the background
// once the cache expires.
//
// allowQuery lists BOTH `filter` and `q`: a query param left OUT of this
// list is not "always fresh" — Vercel ignores it for cache-key purposes,
// meaning a request like `/?q=OpenAI` could be served the cached "/" HTML
// (wrong search results). Listing `q` here gives every filter+search
// combination its own correct cache entry instead.
export default defineNitroConfig({
  routeRules: {
    '/': {
      isr: {
        expiration: 1800, // 30 minutes
        allowQuery: ['filter', 'q'],
        passQuery: true,
      },
    },
  },
})
