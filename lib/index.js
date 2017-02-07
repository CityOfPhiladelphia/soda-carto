'use strict'
const parser = require('node-soda2-parser')

const processWhere = require('./where')
const processSelect = require('./select')

exports.convertRequest = convertRequest

/**
 * Convert request to a Carto-compatible request
 *
 * @param {string} querystrings - Querystring portion of the request URL
 * @param {Object} [opts]
 * @param {string} [opts.dataset] - Socrata dataset id (ie. s9x7-we12)
 * @param {string} [opts.geomFormat=geojson] - Geometry output format (wkt or geojson)
 * @param {string} [opts.geomAlias=the_geom] - Alias for geometry field
 * @return {string} Carto-compatible SQL query
 */
function convertRequest (querystrings, opts) {
  opts = opts || {}
  opts.geomFormat = opts.geomFormat || 'geojson'
  opts.geomAlias = opts.geomAlias || 'the_geom'

  const ast = parser.parse(querystrings)

  // Process SELECT columns
  ast.columns = processSelect(ast.columns, opts)

  // Add FROM to AST
  if (opts.dataset) ast.from = [ { table: `"${opts.dataset}"` } ]

  // Process WHERE recursively
  if (ast.where) ast.where = processWhere(ast.where, opts)

  // Set default LIMIT
  if (ast.limit === null) ast.limit = constructLimit(1000)

  // Convert AST back to SQL
  const sql = parser.stringify.parse(ast)

  return sql
}

function constructLimit (limit, offset) {
  limit = limit || 0
  offset = offset || 0
  return [ { type: 'number', value: offset }, { type: 'number', value: limit } ]
}
