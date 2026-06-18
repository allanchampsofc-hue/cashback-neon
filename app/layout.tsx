import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cashback Neon · R$49,90 por R$100',
  description: 'Pague R$49,90 e ganhe R$100 de crédito na Neon Pizzaria. Ação limitada!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
