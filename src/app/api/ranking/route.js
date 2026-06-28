import { getRankingRows } from '@/lib/ranking'

export async function GET() {
  const result = await getRankingRows()

  return Response.json(result)
}
