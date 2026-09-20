import type { ReactNode } from 'react'
import '../../frontend/src/global.css'
import '../../frontend/src/public.css'
import '../../frontend/src/site-shell.css'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body data-routing="path">{children}</body>
    </html>
  )
}
