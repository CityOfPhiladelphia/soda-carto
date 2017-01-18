// SELECT processor
module.exports = function (columns, opts) {
  let geomFunc
  if (opts.geomFormat === 'wkt') {
    geomFunc = 'ST_AsText(the_geom)'
  } else if (opts.geomFormat === 'geojson') {
    geomFunc = 'ST_AsGeoJSON(the_geom)::json'
  }

  if (columns === '*') {
    // Convert `SELECT *` to `SELECT *, ST_AsGeoJSON(the_geom)::json AS the_geom`
    return [
      {
        expr: { type: 'star' }
      },
      {
        expr: { type: 'raw', value: geomFunc },
        as: opts.geomAlias
      }
    ]
  } else {
    // Explicit fields selected
    return columns.map(function (col) {
      if (col.expr.type === 'column_ref' && col.expr.column === 'the_geom') {
        // If explicitly selecting `the_geom`, wrap it in a format converter
        col.expr = { type: 'raw', value: geomFunc }
        col.as = col.as || opts.geomAlias
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
