import Link from 'next/link'

import { platformSurfaces, type PlatformSurface } from '../_lib/platformSurfaces'

type SurfaceIndexProps = {
  compact?: boolean
}

export function SurfaceIndex({ compact = false }: SurfaceIndexProps) {
  return (
    <div
      className={
        compact ? 'surface-index__grid surface-index__grid--compact' : 'surface-index__grid'
      }
    >
      {platformSurfaces.map((surface) => (
        <SurfaceCard key={surface.id} surface={surface} />
      ))}
    </div>
  )
}

function SurfaceCard({ surface }: { surface: PlatformSurface }) {
  const className = surface.reserved ? 'surface-card surface-card--reserved' : 'surface-card'
  const children = (
    <>
      <span className="surface-card__marker">{surface.marker}</span>
      <span className="surface-card__status">{surface.status}</span>
      <span className="surface-card__label">
        <strong>{surface.label}</strong>
        <small>{surface.english}</small>
      </span>
      <span className="surface-card__signal">{surface.signal}</span>
      <span className="surface-card__description">{surface.description}</span>
    </>
  )

  if (surface.href) {
    return (
      <Link className={className} href={surface.href}>
        {children}
      </Link>
    )
  }

  return <article className={className}>{children}</article>
}
