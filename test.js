const test = require('tape')
const convertRequest = require('./lib').convertRequest

const star = '*, ST_AsGeoJSON(the_geom)::json AS the_geom'

test('select: multiple fields', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=foo, bar`)
  t.equal(sql, `SELECT foo, bar`)
})

test('select: wildcard converts geometry type', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=*`)
  t.equal(sql, `SELECT ${star}`)
})

test('select: convex hull', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=convex_hull(geom)`)
  t.equal(sql, `SELECT ST_ConvexHull(ST_Collect(geom))`)
})

test('select: field alias', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=foo, bar as baz`)
  t.equal(sql, `SELECT foo, bar AS baz`)
})

test.skip('select: date truncate', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=date_trunc_ym(datetime) as month`)
  t.equal(sql, `SELECT date_trunc(datetime, 'month')`)
})

test('select: operators', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$select=location, depth * 3.28 AS depth_feet, end - start AS duration`)
  t.equal(sql, `SELECT location, depth * 3.28 AS depth_feet, end - start AS duration`)
})

test('where: operator', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=foo < 3`)
  t.equal(sql, `SELECT ${star} WHERE foo < 3`)
})

test('where: and/or', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=magnitude > 3.1 and source = 'pr'`)
  t.equal(sql, `SELECT ${star} WHERE magnitude > 3.1 AND source = 'pr'`)
})

test('where: named filters set types', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `foo=1&bar=quz`)
  t.equal(sql, `SELECT ${star} WHERE foo = 1 AND bar = 'quz'`)
})

test('where: named filters with where clause', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `foo=1&$where=bar = 2`)
  t.equal(sql, `SELECT ${star} WHERE bar = 2 AND foo = 1`)
})

test('where: within box', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=within_box(geom, 47.5, -122.3, 47.5, -122.3)`)
  t.equal(sql, `SELECT ${star} WHERE geom && ST_MakeEnvelope(47.5, -122.3, 47.5, -122.3, 4326)`)
})

test('where: within circle', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=within_circle(geom, 47.59815, -122.33454, 500)`)
  t.equal(sql, `SELECT ${star} WHERE ST_Point_Inside_Circle(geom, 47.59815, -122.33454, 0.005)`)
})

test('where: within polygon', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=within_polygon(geom, 'MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')`)
  t.equal(sql, `SELECT ${star} WHERE ST_Within(geom, ST_GeometryFromText('MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))'))`)
})

test('where: geometry and basic filters together', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=foo < 2 and within_box(geom, 47.5, -122.3, 47.5, -122.3) AND bar = 'test'`)
  t.equal(sql, `SELECT ${star} WHERE foo < 2 AND geom && ST_MakeEnvelope(47.5, -122.3, 47.5, -122.3, 4326) AND bar = 'test'`)
})

test.skip('where: full text search', function (t) { // seems to require table name
  t.plan(1)
  const sql = convertRequest('crimes', `$q=foo bar`)
  t.equal(sql, `SELECT ${star} WHERE crimes::text ILIKE '%foo bar%'`)
})

test.skip('group: date truncate', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$group=date_trunc_ym(datetime)`)
  t.equal(sql, `SELECT ${star} GROUP BY date_trunc(datetime, 'month')`)
})

test.skip('limit', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$limit=10`)
  t.equal(sql, `SELECT ${star} LIMIT 10`)
})
