import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyDevBook',
  description: '포트폴리오 관리 및 상태 추적 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

