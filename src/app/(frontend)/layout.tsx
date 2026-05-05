import type { Metadata } from 'next'
import React from 'react'
import './styles.css'
import { ThemeScript } from './_components/ThemeScript'
import { siteConfig } from '@/lib/siteMetadata'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  applicationName: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: 'website',
    url: '/',
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  twitter: {
    card: 'summary',
    description: siteConfig.description,
    title: siteConfig.name,
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
