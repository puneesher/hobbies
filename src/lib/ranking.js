import { getDocuments } from '@/lib/simple-query/index.js'

export function getCurrentYearStart() {
  return `${new Date().getFullYear()}-01-01`
}

export async function getRankingRows() {
  const currentYearStart = getCurrentYearStart()

  return getDocuments('results', {
    select: `
      "player",
      count(*) tournaments,
      sum("wins")+sum("losses") games,
      sum("wins") wins,
      sum("losses") losses,
      round(100*sum("wins")/(0.000000000001+sum("wins")+sum("losses")),2) pctg,
      sum("points_for") pf,
      sum("points_against") pa,
      sum("points_for")-sum("points_against") diff,
      sum("points") points
    `,
    where:   `"date">='${currentYearStart}' and 1=1`,
    orderBy: `6 desc, 2 desc, 7 desc`,
    groupBy: `"player"`,
    having:  `count(*)>2`,
  })
}
