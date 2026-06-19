import { Request, Response, NextFunction } from 'express'

// 404 handler for unmatched routes.
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' })
}

// Centralized error handler — never leaks stack traces or internal details to
// the client. Checklist: "Avoid returning sensitive data (credentials, tokens,
// etc)" and "Make sure debug mode is off in production".
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Log full detail server-side only.
  console.error('[error]', err)

  // Malformed JSON body (express.json throws a SyntaxError with `status`).
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({ error: 'Invalid JSON payload' })
    return
  }

  // Generic response — no internal information disclosed.
  res.status(500).json({ error: 'Internal server error' })
}
