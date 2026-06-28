import 'server-only'
import { randomUUID } from 'crypto'
import { query } from './query.js'

const dataColumn = 'data'
const namePattern = /^[A-Za-z][A-Za-z0-9_$#]*(\.[A-Za-z][A-Za-z0-9_$#]*)?$/

export async function getDocuments(collection, options = {}) {
  const safeCollection = assertSafeName(collection, 'collection')
  const { sql: select, isDefaultSelect } = buildSelect(options.select)
  const { sql: where, binds: whereBinds } = buildWhere(options.where)
  const groupBy = buildGroupBy(options.groupBy)
  const having = buildHaving(options.having)
  const orderBy = buildOrderBy(options.orderBy)
  const limit = Number(options.limit ?? 100)
  const result = await query(
    `select ${select} from ${safeCollection} c${where}${groupBy}${having}${orderBy} fetch first :limit rows only`,
    { ...whereBinds, limit },
  )

  if (!isDefaultSelect) {
    return result.rows
  }

  return result.rows.map(row => parseDocument(row.DATA ?? row.data))
}

export async function getDocumentById(collection, id, options = {}) {
  const safeCollection = assertSafeName(collection, 'collection')
  const result = await query(
    `select ${dataColumn} from ${safeCollection} c where c.${dataColumn}."_id" = :id fetch first 1 row only`,
    { id },
  )
  const row = result.rows[0]

  if (!row) {
    return null
  }

  return parseDocument(row.DATA ?? row.data)
}

export async function createDocument(collection, document, options = {}) {
  const safeCollection = assertSafeName(collection, 'collection')
  const nextDocument = normalizeDocument(document, options)
  const result = await query(
    `insert into ${safeCollection} (${dataColumn}) values (:data)`,
    { data: JSON.stringify(nextDocument) },
    { autoCommit: true },
  )

  return {
    document: nextDocument,
    rowsAffected: result.rowsAffected,
  }
}

export async function replaceDocument(collection, id, document, options = {}) {
  const safeCollection = assertSafeName(collection, 'collection')
  const nextDocument = normalizeDocument({ ...document, _id: id }, options)
  const result = await query(
    `update ${safeCollection} c set ${dataColumn} = :data where c.${dataColumn}."$._id" = :id`,
    { id, data: JSON.stringify(nextDocument) },
    { autoCommit: true },
  )

  return {
    document: nextDocument,
    rowsAffected: result.rowsAffected,
  }
}

export async function deleteDocument(collection, id, options = {}) {
  const safeCollection = assertSafeName(collection, 'collection')
  const result = await query(
    `delete from ${safeCollection} c where c.${dataColumn}."$._id" = :id`,
    { id },
    { autoCommit: true },
  )

  return {
    rowsAffected: result.rowsAffected,
  }
}

function assertSafeName(name, label) {
  if (!name || typeof name !== 'string' || !namePattern.test(name)) {
    throw new Error(`Invalid ${label}`)
  }

  return name
}

function buildWhere(where) {
  if (!where) {
    return { sql: '', binds: {} }
  }

  if (typeof where === 'string') {
    return {
      sql: ` where ${prefixDataAttributes(where)}`,
      binds: {},
    }
  }

  throw new Error('Invalid where')
}

function buildSelect(select) {
  if (!select) {
    return { sql: dataColumn, isDefaultSelect: true }
  }

  if (typeof select === 'string') {
    return {
      sql: prefixDataAttributes(select),
      isDefaultSelect: false,
    }
  }

  throw new Error('Invalid select')
}

function buildGroupBy(groupBy) {
  if (!groupBy) {
    return ''
  }

  if (typeof groupBy === 'string') {
    return ` group by ${prefixDataAttributes(groupBy).replace(/^group\s+by\s+/i, '')}`
  }

  throw new Error('Invalid groupBy')
}

function buildHaving(having) {
  if (!having) {
    return ''
  }

  if (typeof having === 'string') {
    return ` having ${prefixDataAttributes(having).replace(/^having\s+/i, '')}`
  }

  throw new Error('Invalid having')
}

function buildOrderBy(orderBy) {
  if (!orderBy) {
    return ''
  }

  if (typeof orderBy === 'string') {
    return ` order by ${prefixDataAttributes(orderBy).replace(/^order\s+by\s+/i, '')}`
  }

  throw new Error('Invalid orderBy')
}

function prefixDataAttributes(value) {
  return value
    .trim()
    .replace(/^where\s+/i, '')
    .replace(/"[^"]+"/g, value => `c.${dataColumn}.${value}`)
}

function normalizeDocument(document, options) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('Document must be an object')
  }

  return {
    ...document,
    _id: document._id ?? options.idFactory?.() ?? randomUUID(),
  }
}

function parseDocument(value) {
  if (typeof value === 'string') {
    return JSON.parse(value)
  }

  return value
}
