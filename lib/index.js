const parser = require('node-soda2-parser')

const processWhere = require('./where')
const processSelect = require('./select')

exports.convertRequest = convertRequest

function convertRequest (resource, querystrings) {
  const ast = parser.parse(querystrings)

  // Process SELECT columns
  ast.columns = processSelect(ast.columns)

  // Add FROM to AST
  if (resource) ast.from = [ { table: `"${resource}"` } ]

  // Process WHERE recursively
  if (ast.where) ast.where = processWhere(ast.where)

  // Convert AST back to SQL
  const sql = parser.stringify.parse(ast)

  return sql
}


