import { publicClient } from '../../../lib/public-data'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp|avif)$/.test(name)) return new Response(null, { status: 404 })
  const { data, error } = await publicClient().storage.from('media').createSignedUrl(name, 60)
  if (error || !data)
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return new Response(null, {
    status: 307,
    headers: { Location: data.signedUrl, 'Cache-Control': 'private, no-store' },
  })
}
