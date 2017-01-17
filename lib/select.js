// SELECT processor
module.exports = function (columns) {
  if (columns === '*') {
    // Convert `SELECT *` to `SELECT *, ST_AsGeoJSON(the_geom)::json AS the_geom`
    return [
      {
        expr: {
          type: 'star'
        }
      },
      {
        expr: {
          type: 'raw',
          value: 'ST_AsGeoJSON(the_geom)::json'
        },
        as: 'the_geom'
      }
    ]
  } else {
    // Explicit fields selected
    return columns.map(function (col) {
      // Wrap any `the_geom` selections in `ST_AsGeoJSON(...)::json AS ...)`
      if (col.expr.type === 'column_ref' && col.expr.column === 'the_geom') {
        col.expr = {
          type: 'raw',
          value: 'ST_AsGeoJSON(the_geom)::json'
        }
        col.as = col.as || 'the_geom'
      } else if (col.expr.type === 'aggr_func') {
        // PostGISify Socrata's convex_hull function
        if (col.expr.name === 'convex_hull') {
          col.expr = {
            type: 'raw',
            value: 'ST_ConvexHull(ST_Collect(' + col.expr.args.expr.column + '))'
          }
        }
      }
      return col
    })
  }
}
