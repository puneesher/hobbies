import nextEnv from '@next/env'

import { getOraclePool } from '../src/lib/simple-query/connection.js'
import { query } from '../src/lib/simple-query/query.js'

const collection = 'results'
const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

const pool = await getOraclePool()

try {
  const result = await query(
    `delete from ${collection}`,
    {},
    { autoCommit: true },
  )

  console.log(`Deleted ${result.rowsAffected} documents from ${collection}`)
} finally {
  await pool.close(0)
}
