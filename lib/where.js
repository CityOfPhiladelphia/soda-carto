'use strict'
// Recursive WHERE processor
module.exports = function (expr, opts) {
  // If AND or OR, recurse
  if (expr.type === 'binary_expr' && (expr.operator === 'AND' || expr.operator === 'OR')) {
    expr.left = module.exports(expr.left)
    expr.right = module.exports(expr.right)
  } else if (expr.type === 'function') {
    // within_box()
    if (expr.name === 'within_box') {
      expr.args.value.shift() // remove first arg
      const points = expr.args.value.map((item) => item.value)
      points.reverse() // socrata uses backwards, non OGC-compliant order
      expr = {
        type: 'raw',
        value: 'the_geom && ST_MakeEnvelope(' + points.join(', ') + ', 4326)'
      }
    } else if (expr.name === 'within_circle') {
      // within_circle()
      const lat = expr.args.value[1].value
      const lng = expr.args.value[2].value
      const radius = expr.args.value[3].value
      expr = {
        type: 'raw',
        value: `ST_DWithin(the_geom::geography, ST_GeographyFromText('POINT(${lng} ${lat})'), ${radius})`
      }
    } else if (expr.name === 'within_polygon') {
      // within_polygon()
      expr = {
        type: 'raw',
        value: 'ST_Within(the_geom, ST_GeometryFromText(\'' + expr.args.value[1].value + '\'))'
      }
    } else if (expr.name === 'intersects') {
      // intersects()
      const wkt = expr.args.value[1].value
      expr = {
        type: 'raw',
        value: 'ST_Intersects(the_geom, \'' + wkt + '\'::geometry)'
      }
    }
  }
  return expr
}
