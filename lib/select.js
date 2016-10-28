// SELECT processor
module.exports = function (columns, fields) {
  if (columns === '*') return columns

  columns.forEach(function (col) {
    if (col.expr.type === 'aggr_func') {
      // convex_hull()
      if (col.expr.name === 'convex_hull') {
        col.expr = {
          type: 'raw',
          value: 'ST_ConvexHull(ST_Collect(' + col.expr.args.expr.column + '))'
        }
      }
    }
  })
  return columns
}
