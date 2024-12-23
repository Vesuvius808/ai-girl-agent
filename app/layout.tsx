import '@solana/wallet-adapter-react-ui/styles.css' // Adapter's default styles
import './globals.css' // Your global overrides
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Agent Token Presale',
  description: 'Join the future of decentralized AI with our revolutionary token presale.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
