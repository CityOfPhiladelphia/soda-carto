const test = require('tape')
const convert = require('../lib').convertRequest

const star = '*, ST_AsGeoJSON(the_geom)::json AS location'
const limit = 'LIMIT 1000' // default limit per lib/index.js

test('$select: wildcard converts geometry type', (t) => {
  t.plan(1)
  const input = `$select=*`
  const expect = `SELECT ${star} ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: comma-separated fields', (t) => {
  t.plan(1)
  const input = `$select=foo, bar`
  const expect = `SELECT foo, bar ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: aliases', (t) => {
  t.plan(1)
  const input = `$select=foo AS bar`
  const expect = `SELECT foo AS bar ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: operators', (t) => {
  t.plan(1)
  const input = `$select=foo * 2 AS double_foo`
  const expect = `SELECT foo * 2 AS double_foo ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: count', (t) => {
  t.plan(1)
  const input = `$select=count(*) AS count`
  const expect = `SELECT COUNT(*) AS count ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: sum', (t) => {
  t.plan(1)
  const input = `$select=sum(foo) AS total`
  const expect = `SELECT sum(foo) AS total ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: average', (t) => {
  t.plan(1)
  const input = `$select=avg(foo)`
  const expect = `SELECT avg(foo) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: minimum', (t) => {
  t.plan(1)
  const input = `$select=min(foo)`
  const expect = `SELECT min(foo) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: maximum', (t) => {
  t.plan(1)
  const input = `$select=max(foo)`
  const expect = `SELECT max(foo) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: date truncation (y/ym/ymd)', (t) => {
  t.plan(1)
  const input = `$select=date_trunc_ym(datetime) AS month`
  const expect = `SELECT date_trunc(datetime, 'month') ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: convex_hull', (t) => {
  t.plan(1)
  const input = `$select=convex_hull(location)`
  const expect = `SELECT ST_ConvexHull(ST_Collect(the_geom)) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: case', (t) => {
  t.plan(1)
  const input = `$select=case(type = 'A', 'Full', type = 'B', 'Partial')`
  const expect = `SELECT CASE WHEN type = 'A' THEN 'Full' WHEN type = 'B' THEN 'Partial' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: extent', (t) => {
  t.plan(1)
  const input = `$select=extent(location)`
  const expect = `SELECT ST_Extent(the_geom) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: simplify', (t) => {
  t.plan(1)
  const input = `$select=simplify(location, 0.001)`
  const expect = `SELECT ST_Simplify(the_geom, 0.001) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: number of vertices', (t) => {
  t.plan(1)
  const input = `$select=num_points(location)`
  const expect = `SELECT ST_NPoints(the_geom) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: distance in meters', (t) => {
  t.plan(1)
  const input = `$select=distance_in_meters(location, 'POINT(-122.334540 47.59815)') AS range`
  const expect = `SELECT ST_Distance(the_geom::geography, ST_GeographyFromText('POINT(-122.334540 47.59815)')) AS range ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$select: concatenate strings', (t) => {
  t.plan(1)
  const input = `$select=foo || bar`
  const expect = `SELECT foo || bar ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: geometry field alias', (t) => {
  t.plan(1)
  const input = `$select=*`
  const expect = `SELECT *, ST_AsGeoJSON(the_geom)::json AS location ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$select: geometry field alias replaced in functions', (t) => {
  t.plan(1)
  const input = `$select=convex_hull(location)`
  const expect = `SELECT ST_ConvexHull(ST_Collect(the_geom)) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: equality expression', (t) => {
  t.plan(1)
  const input = `$where=foo = 'bar'`
  const expect = `SELECT ${star} WHERE foo = 'bar' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: AND operator', (t) => {
  t.plan(1)
  const input = `$where=foo = 'bar' AND baz = 2`
  const expect = `SELECT ${star} WHERE foo = 'bar' AND baz = 2 ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: parentheses', (t) => {
  t.plan(1)
  const input = `$where=foo = 'bar' AND (baz = 2 OR baz = 3)`
  const expect = `SELECT ${star} WHERE foo = 'bar' AND (baz = 2 OR baz = 3) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: operators', (t) => {
  t.plan(1)
  const input = `$where=end - start < 3`
  const expect = `SELECT ${star} WHERE end - start < 3 ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: simple filters', (t) => {
  t.plan(1)
  const input = `foo=bar&baz=1`
  const expect = `SELECT ${star} WHERE foo = 'bar' AND baz = '1' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: simple filters with $where clause', (t) => {
  t.plan(1)
  const input = `foo=bar&$where=baz = 1`
  const expect = `SELECT ${star} WHERE baz = 1 AND foo = 'bar' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$where: quotes within strings', (t) => {
  t.plan(1)
  const input = `$where=foo = 'bob''s burgers'`
  const expect = `SELECT ${star} WHERE foo = 'bob''s burgers' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: quotes within simple filters', (t) => {
  t.plan(1)
  const input = `foo=bob's burgers`
  const expect = `SELECT ${star} WHERE foo = 'bob''s burgers' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: boolean fields', (t) => {
  t.plan(1)
  const input = `$where=foo = true`
  const expect = `SELECT ${star} WHERE foo = TRUE ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: boolean fields short-hand', (t) => {
  t.plan(1)
  const input = `$where=foo`
  const expect = `SELECT ${star} WHERE foo ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: in function', (t) => {
  t.plan(1)
  const input = `$where=foo in ('bar', 'baz')`
  const expect = `SELECT ${star} WHERE foo IN ('bar', 'baz') ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: not in function', (t) => {
  t.plan(1)
  const input = `$where=foo not in ('bar', 'baz')`
  const expect = `SELECT ${star} WHERE foo NOT IN ('bar', 'baz') ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: between', (t) => {
  t.plan(1)
  const input = `$where=foo between '100' and '200'`
  const expect = `SELECT ${star} WHERE foo BETWEEN '100' AND '200' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$where: not between', (t) => {
  t.plan(1)
  const input = `$where=foo not between '100' and '200'`
  const expect = `SELECT ${star} WHERE foo NOT BETWEEN '100' AND '200 ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: intersects', (t) => {
  t.plan(1)
  const input = `$where=intersects(location, 'POINT (-12.3, 45.6)')`
  const expect = `SELECT ${star} WHERE ST_Intersects(the_geom, 'POINT (-12.3, 45.6)'::geometry) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$where: starts with', (t) => {
  t.plan(1)
  const input = `$where=starts_with(title, 'chief')`
  const expect = `SELECT ${star} WHERE title LIKE 'chief%' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: within box', (t) => {
  t.plan(1)
  const input = `$where=within_box(location, 47.6, -122.4, 47.4, -122.2)` //socrata is noncompliant in order, NWlat (ymax), NWlon (xmax), SElat (ymin), SElon (xmin)
  const expect = `SELECT ${star} WHERE the_geom && ST_MakeEnvelope(-122.2, 47.4, -122.4, 47.6, 4326) ${limit}` //this is tricky, PostGIS takes OGC-compliant xmin, ymin, xmax, ymax order
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: within circle', (t) => {
  t.plan(1)
  const input = `$where=within_circle(location, 47.59815, -122.33454, 500)`
  const expect = `SELECT ${star} WHERE ST_DWithin(the_geom::geography, ST_GeographyFromText('POINT(-122.33454 47.59815)'), 500) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$where: within polygon', (t) => {
  t.plan(1)
  const input = `$where=within_polygon(location, 'MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')`
  const expect = `SELECT ${star} WHERE ST_Within(the_geom, ST_GeometryFromText('MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')) ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$where: record updated', (t) => {
  t.plan(1)
  const input = `$where=:updated_at > '2017-02-19' ${limit}`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$order: order by', (t) => {
  t.plan(1)
  const input = `$order=foo`
  const expect = `SELECT ${star} ORDER BY foo ASC ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$order: order by with direction', (t) => {
  t.plan(1)
  const input = `$order=foo DESC`
  const expect = `SELECT ${star} ORDER BY foo DESC ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$group: group by', (t) => {
  t.plan(1)
  const input = `$group=foo`
  const expect = `SELECT ${star} GROUP BY foo ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$group: group by truncated date', (t) => {
  t.plan(1)
  const input = `$group=date_trunc_ym(datetime)`
  const expect = `SELECT ${star} GROUP BY date_trunc(datetime, 'month') ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$having: having', (t) => {
  t.plan(1)
  const input = `$select=count(*) AS count&$group=bar&$having=count > 20`
  const expect = `SELECT COUNT(*) AS count GROUP BY bar HAVING count > 20 ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$limit: limit', (t) => {
  t.plan(1)
  const input = `$limit=10`
  const expect = `SELECT ${star} LIMIT 10`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$limit: default limit of 1000', (t) => {
  t.plan(1)
  const input = `$select=foo`
  const expect = `SELECT foo ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test('$offset: offset', (t) => {
  t.plan(1)
  const input = `$limit=10&$offset=5`
  const expect = `SELECT ${star} LIMIT 10 OFFSET 5`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$q: full-text search', (t) => {
  t.plan(1)
  const input = `$q=foo`
  const expect = `SELECT ${star} WHERE table_name::text ILIKE '%foo%' ${limit}`
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$q: stemming', (t) => {
  t.plan(1)
  const input = `$q=users`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$q: multiple words are ANDed', (t) => {
  t.plan(1)
  const input = `$q=test user`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$query: soql query', (t) => {
  t.plan(1)
  const input = `$query=SELECT ${star} WHERE foo = 'bar' ${limit}`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$query: sub-query', (t) => {
  t.plan(1)
  const input = `$query=SELECT city_feature, COUNT(*) AS count GROUP BY city_feature |> SELECT COUNT(city_feature) AS num_types, SUM(count) AS total_features ${limit}`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})

test.skip('$jsonp: jsonp callback', (t) => {
  t.plan(1)
  const input = `$jsonp=callback`
  const expect = ``
  const output = convert(input, { geomAlias: 'location' })
  t.equal(output, expect)
})
