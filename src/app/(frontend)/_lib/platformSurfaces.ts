import { uiCopy, type PlatformSurfaceCopy } from './uiCopy'

export type PlatformSurface = PlatformSurfaceCopy

export const primaryNav = uiCopy.navigation.primary
export const platformSurfaces: readonly PlatformSurface[] = uiCopy.platform.surfaces
