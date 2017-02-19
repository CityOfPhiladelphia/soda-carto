const star = '*, ST_AsGeoJSON(the_geom)::json AS the_geom_geojson'
const limit = 'LIMIT 1000' // default limit per lib/index.js

module.exports = [
  {
    label: `$select: wildcard converts geometry type`,
    input: `$select=*`,
    expect: `SELECT ${star} ${limit}`
  },
  {
    label: `$select: comma-separated fields`,
    input: `$select=foo, bar`,
    expect: `SELECT foo, bar ${limit}`
  },
  {
    label: `$select: aliases`,
    input: `$select=foo AS bar`,
    expect: `SELECT foo AS bar ${limit}`
  },
  {
    label: `$select: operators`,
    input: `$select=foo * 2 AS double_foo`,
    expect: `SELECT foo * 2 AS double_foo ${limit}`
  },
  {
    label: `$select: count`,
    input: `$select=count(*) AS count`,
    expect: `SELECT COUNT(*) AS count ${limit}`
  },
  {
    label: `$select: sum`,
    input: `$select=sum(foo) AS total`,
    expect: `SELECT sum(foo) AS total ${limit}`
  },
  {
    label: `$select: average`,
    input: `$select=avg(foo)`,
    expect: `SELECT avg(foo) ${limit}`
  },
  {
    label: `$select: minimum`,
    input: `$select=min(foo)`,
    expect: `SELECT min(foo) ${limit}`
  },
  {
    label: `$select: maximum`,
    input: `$select=max(foo)`,
    expect: `SELECT max(foo) ${limit}`
  },
  {
    label: `$select: date truncation (y/ym/ymd)`,
    input: `$select=date_trunc_ym(datetime) AS month`,
    expect: `SELECT date_trunc(datetime, 'month') ${limit}`,
    skip: true
  },
  {
    label: `$select: convex_hull`,
    input: `$select=convex_hull(location)`,
    expect: `SELECT ST_ConvexHull(ST_Collect(location)) ${limit}`
  },
  {
    label: `$select: case`,
    input: `$select=case(type = 'A', 'Full', type = 'B', 'Partial')`,
    expect: `SELECT CASE WHEN type = 'A' THEN 'Full' WHEN type = 'B' THEN 'Partial' ${limit}`,
    skip: true
  },
  {
    label: `$select: extent`,
    input: `$select=extent(location)`,
    expect: `SELECT ST_Extent(location) ${limit}`,
    skip: true
  },
  {
    label: `$select: simplify`,
    input: `$select=simplify(location, 0.001)`,
    expect: `SELECT ST_Simplify(location, 0.001) ${limit}`,
    skip: true
  },
  {
    label: `$select: number of vertices`,
    input: `$select=num_points(location)`,
    expect: `SELECT ST_NumPoints(location) ${limit}`,
    skip: true
  },
  {
    label: `$select: distance in meters`,
    input: `$select=distance_in_meters(location, 'POINT(-122.334540 47.59815)') AS range`,
    expect: `SELECT ST_Distance(location, 'POINT(-122.334540 47.59815)') AS range ${limit}`,
    skip: true
  },
  {
    label: `$select: concatenate strings`,
    input: `$select=foo || bar`,
    expect: `SELECT foo || bar ${limit}`,
    skip: true
  },
  {
    label: `$where: equality expression`,
    input: `$where=foo = 'bar'`,
    expect: `SELECT ${star} WHERE foo = 'bar' ${limit}`
  },
  {
    label: `$where: AND operator`,
    input: `$where=foo = 'bar' AND baz = 2`,
    expect: `SELECT ${star} WHERE foo = 'bar' AND baz = 2 ${limit}`
  },
  {
    label: `$where: parentheses`,
    input: `$where=foo = 'bar' AND (baz = 2 OR baz = 3)`,
    expect: `SELECT ${star} WHERE foo = 'bar' AND (baz = 2 OR baz = 3) ${limit}`
  },
  {
    label: `$where: operators`,
    input: `$where=end - start < 3`,
    expect: `SELECT ${star} WHERE end - start < 3 ${limit}`
  },
  {
    label: `$where: simple filters`,
    input: `foo=bar&baz=1`,
    expect: `SELECT ${star} WHERE foo = 'bar' AND baz = '1' ${limit}`
  },
  {
    label: `$where: simple filters with $where clause`,
    input: `foo=bar&$where=baz = 1`,
    expect: `SELECT ${star} WHERE baz = 1 AND foo = 'bar' ${limit}`
  },
  {
    label: `$where: quotes within strings`,
    input: `$where=foo = 'bob''s burgers'`,
    expect: `SELECT ${star} WHERE foo = 'bob''s burgers' ${limit}`,
    skip: true
  },
  {
    label: `$where: quotes within simple filters`,
    input: `foo=bob's burgers`,
    expect: `SELECT ${star} WHERE foo = 'bob''s burgers' ${limit}`
  },
  {
    label: `$where: boolean fields`,
    input: `$where=foo = true`,
    expect: `SELECT ${star} WHERE foo = TRUE ${limit}`
  },
  {
    label: `$where: boolean fields short-hand`,
    input: `$where=foo`,
    expect: `SELECT ${star} WHERE foo ${limit}`
  },
  {
    label: `$where: in function`,
    input: `$where=foo in ('bar', 'baz')`,
    expect: `SELECT ${star} WHERE foo IN ('bar', 'baz') ${limit}`
  },
  {
    label: `$where: not in function`,
    input: `$where=foo not in ('bar', 'baz')`,
    expect: `SELECT ${star} WHERE foo NOT IN ('bar', 'baz') ${limit}`
  },
  {
    label: `$where: between`,
    input: `$where=foo between '100' and '200'`,
    expect: `SELECT ${star} WHERE foo BETWEEN '100' AND '200' ${limit}`
  },
  {
    label: `$where: not between`,
    input: `$where=foo not between '100' and '200'`,
    expect: `SELECT ${star} WHERE foo NOT BETWEEN '100' AND '200 ${limit}`,
    skip: true
  },
  {
    label: `$where: intersects`,
    input: `$where=intersects(location, 'POINT (-12.3, 45.6)')`,
    expect: `SELECT ${star} WHERE ST_Intersects(location, 'POINT (-12.3, 45.6)') ${limit}`,
    skip: true
  },
  {
    label: `$where: starts with`,
    input: `$where=starts_with(title, 'chief')`,
    expect: `SELECT ${star} WHERE title LIKE 'chief%' ${limit}`,
    skip: true
  },
  {
    label: `$where: within box`,
    input: `$where=within_box(location, 47.5, -122.3, 47.5, -122.3)`,
    expect: `SELECT ${star} WHERE location && ST_MakeEnvelope(47.5, -122.3, 47.5, -122.3, 4326) ${limit}`
  },
  {
    label: `$where: within circle`,
    input: `$where=within_circle(location, 47.59815, -122.33454, 500)`,
    expect: `SELECT ${star} WHERE ST_Point_Inside_Circle(location, 47.59815, -122.33454, 0.005) ${limit}`
  },
  {
    label: `$where: within polygon`,
    input: `$where=within_polygon(location, 'MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')`,
    expect: `SELECT ${star} WHERE ST_Within(location, ST_GeometryFromText('MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')) ${limit}`
  },
  {
    label: `$where: record updated`,
    input: `$where=:updated_at > '2017-02-19' ${limit}`,
    expect: ``,
    skip: true
  },
  {
    label: `$order: order by`,
    input: `$order=foo`,
    expect: `SELECT ${star} ORDER BY foo ASC ${limit}`
  },
  {
    label: `$order: order by with direction`,
    input: `$order=foo DESC`,
    expect: `SELECT ${star} ORDER BY foo DESC ${limit}`
  },
  {
    label: `$group: group by`,
    input: `$group=foo`,
    expect: `SELECT ${star} GROUP BY foo ${limit}`
  },
  {
    label: `$group: group by truncated date`,
    input: `$group=date_trunc_ym(datetime)`,
    expect: `SELECT ${star} GROUP BY date_trunc(datetime, 'month') ${limit}`,
    skip: true
  },
  {
    label: `$having: having`,
    input: `$select=count(*) AS count&$group=bar&$having=count > 20`,
    expect: `SELECT COUNT(*) AS count GROUP BY bar HAVING count > 20 ${limit}`,
    skip: true
  },
  {
    label: `$limit: limit`,
    input: `$limit=10`,
    expect: `SELECT ${star} LIMIT 10`
  },
  {
    label: `$limit: default limit of 1000`,
    input: `$select=foo`,
    expect: `SELECT foo LIMIT 1000`
  },
  {
    label: `$offset: offset`,
    input: `$limit=10&$offset=5`,
    expect: `SELECT ${star} LIMIT 10 OFFSET 5`
  },
  {
    label: `$q: full-text search`,
    input: `$q=foo`,
    expect: `SELECT ${star} WHERE table_name::text ILIKE '%foo%' ${limit}`,
    skip: true
  },
  {
    label: `$q: stemming`,
    input: `$q=users`,
    expect: ``,
    skip: true
  },
  {
    label: `$q: multiple words are ANDed`,
    input: `$q=test user`,
    expect: ``,
    skip: true
  },
  {
    label: `$query: soql query`,
    input: `$query=SELECT ${star} WHERE foo = 'bar' ${limit}`,
    expect: ``,
    skip: true
  },
  {
    label: `$query: sub-query`,
    input: `$query=SELECT city_feature, COUNT(*) AS count GROUP BY city_feature |> SELECT COUNT(city_feature) AS num_types, SUM(count) AS total_features ${limit}`,
    expect: ``,
    skip: true
  },
  {
    label: `$jsonp: jsonp callback`,
    input: `$jsonp=callback`,
    expect: ``,
    skip: true
  }
]
