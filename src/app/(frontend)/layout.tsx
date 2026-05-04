import React from 'react'
import './styles.css'

export const metadata = {
  description: 'The personal digital platform for Myshkin 451.',
  title: 'Myshkin 451',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
