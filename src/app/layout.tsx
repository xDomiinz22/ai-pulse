import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import '../index.css'

export const metadata: Metadata = {
  title: 'AI Pulse — Artificial Intelligence News',
  description:
    'Breakthroughs, research and industry moves from across the artificial-intelligence world — filtered, summarized and ranked, fresh from the wire every hour.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Same Google Fonts setup the Vite index.html used — kept verbatim so
            the @theme font stacks in index.css keep resolving identically. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
