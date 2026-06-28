import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import nextEnv from '@next/env'

import { getOraclePool } from '../src/lib/simple-query/connection.js'
import { query } from '../src/lib/simple-query/query.js'

const collection = 'results'
const dataFile = resolve('data/results.json')
const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

const raw = await readFile(dataFile, 'utf8')
const documents = JSON.parse(raw)

if (!Array.isArray(documents)) {
  throw new Error(`${dataFile} must contain a JSON array`)
}

let inserted = 0
const pool = await getOraclePool()

try {
  for (const document of documents) {
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      throw new Error(`Element at index ${inserted} must be a JSON object`)
    }

    const nextDocument = {
      ...document,
      _id: document._id ?? randomUUID(),
    }

    await query(
      `insert into ${collection} (data) values (:data)`,
      { data: JSON.stringify(nextDocument) },
      { autoCommit: true },
    )

    inserted += 1
  }

  console.log(`Inserted ${inserted} documents into ${collection}`)
} finally {
  await pool.close(0)
}
