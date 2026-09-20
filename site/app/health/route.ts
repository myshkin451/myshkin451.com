import { publicClient } from '../../lib/public-data'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const { error } = await publicClient().from('site_settings').select('id').limit(1)
    if (error) throw error
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
