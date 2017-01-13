const test = require('tape')
const convertRequest = require('./lib').convertRequest

test('select: multiple fields', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$select=foo, bar')
  t.equal(sql, 'SELECT foo, bar')
})

test('select: wildcard', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$select=*')
  t.equal(sql, 'SELECT *')
})

test('select: convex hull', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$select=convex_hull(geom)')
  t.equal(sql, 'SELECT ST_ConvexHull(ST_Collect(geom))')
})

test('where: operator', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$where=foo < 3')
  t.equal(sql, 'SELECT * WHERE foo < 3')
})

test('where: within box', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$where=within_box(geom, 47.5, -122.3, 47.5, -122.3)')
  t.equal(sql, 'SELECT * WHERE geom && ST_MakeEnvelope(47.5, -122.3, 47.5, -122.3, 4326)')
})

test('where: within circle', function (t) {
  t.plan(1)
  const sql = convertRequest(null, '$where=within_circle(geom, 47.59815, -122.33454, 500)')
  t.equal(sql, 'SELECT * WHERE ST_Point_Inside_Circle(geom, 47.59815, -122.33454, 0.005)')
})

test('where: within polygon', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=within_polygon(geom, 'MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')`)
  t.equal(sql, `SELECT * WHERE ST_Within(geom, ST_GeometryFromText('MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))'))`)
})

test('where: multiple', function (t) {
  t.plan(1)
  const sql = convertRequest(null, `$where=foo < 2 and within_box(geom, 47.5, -122.3, 47.5, -122.3) AND bar = 'test'`)
  t.equal(sql, `SELECT * WHERE foo < 2 AND geom && ST_MakeEnvelope(47.5, -122.3, 47.5, -122.3, 4326) AND bar = 'test'`)
})

