import Image from 'next/image'

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

type CoverImageProps = {
  image: MediaLike
}

export function CoverImage({ image }: CoverImageProps) {
  if (!image || typeof image === 'number' || !image.url) {
    return null
  }

  return (
    <figure className="cover-image">
      <Image
        alt={image.alt ?? ''}
        height={image.height ?? 900}
        src={image.url}
        sizes="(max-width: 720px) 100vw, 40vw"
        width={image.width ?? 1600}
      />
    </figure>
  )
}
