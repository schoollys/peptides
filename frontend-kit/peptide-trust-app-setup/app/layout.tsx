import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Code_Pro } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import { getSessionUser } from '@/lib/auth/session'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  axes: ['opsz'],
  display: 'swap',
})

const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://peptidetrust-app-setup.vercel.app'),
  title: 'PeptideTrust — Реестр доверия',
  description:
    'Нейтральный публичный реестр доверия для участников рынка пептидов и смежных биотехнологических продуктов. Проверяйте, сравнивайте, доверяйте.',
  generator: 'v0.app',
  keywords: ['реестр доверия', 'пептиды', 'биотех', 'верификация', 'PeptideTrust'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8fafd',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser()
  return (
    <html lang="ru" className={`${inter.variable} ${sourceCodePro.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
