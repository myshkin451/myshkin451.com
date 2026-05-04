import type { Metadata } from 'next'

type MediaLike =
  | {
      alt?: null | string
      height?: null | number
      url?: null | string
      width?: null | number
    }
  | null
  | number
  | undefined

type PageMetadataOptions = {
  description: string
  image?: MediaLike
  pathname: string
  title: string
}

export const siteConfig = {
  description:
    'A personal digital platform for writing, projects, knowledge entry points, and experiments.',
  githubUrl: 'https://github.com/myshkin451/myshkin451.com',
  name: 'Myshkin 451',
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.myshkin451.com'),
}

export function absoluteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`

  return `${siteConfig.url}${normalizedPath}`
}

export function createPageMetadata({
  description,
  image,
  pathname,
  title,
}: PageMetadataOptions): Metadata {
  const metadataImage = imageToMetadata(image)
  const resolvedTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`

  return {
    alternates: {
      canonical: pathname,
    },
    description,
    openGraph: {
      description,
      images: metadataImage ? [metadataImage] : undefined,
      siteName: siteConfig.name,
      title: resolvedTitle,
      type: 'website',
      url: pathname,
    },
    title,
    twitter: {
      card: metadataImage ? 'summary_large_image' : 'summary',
      description,
      images: metadataImage ? [metadataImage.url] : undefined,
      title: resolvedTitle,
    },
  }
}

export function imageToMetadata(image: MediaLike) {
  if (!image || typeof image === 'number' || !image.url) {
    return undefined
  }

  return {
    alt: image.alt ?? undefined,
    height: image.height ?? undefined,
    url: image.url,
    width: image.width ?? undefined,
  }
}

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/, '')
}
