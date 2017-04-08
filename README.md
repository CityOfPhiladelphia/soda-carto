# soda-carto [![Build Status](https://travis-ci.org/timwis/soda-carto.svg?branch=master)](https://travis-ci.org/timwis/soda-carto)
Query [Carto](http://carto.com) datasets with a Socrata-style
[SODA2](https://dev.socrata.com/docs/queries/) API. Depends heavily on
[node-soda2-parser](https://github.com/timwis/node-soda2-parser), which is a
light wrapper around the [node-sqlparser](https://www.npmjs.com/package/node-sqlparse://www.npmjs.com/package/node-sqlparser)
AST parser.

## How it works
soda-carto is a _reverse proxy_ meant to simulate a Socrata-style SODA2 API in
front of a Carto API. To do that, it has to (1) translate the inbound SODA
request into a Carto request, and (2) translate the Carto response into a
response format you'd expect from a SODA API. 90% of the work necessary was on
translating the inbound request.

Carto expects a pure PostgreSQL/PostGIS query, and SODA requests are _almost_
SQL to begin with: the SODA API consists of querystring parameters like
`$select`, `$where`, `$group`, $limit`, etc. By combining those values, you can
easily construct a SQL query. The SODA API also allows "simple filters," such as
`?district=north` instead of `$where=district = 'north'`. It also supports a
`$query` parameter where you can write pure SQL, but that isn't supported by
soda-carto under the assumption that it's not commonly used.

In order to translate these combinations of querystrings into a Carto request
(basically a PostgreSQL/PostGIS query), soda-carto first delegates to
[node-soda2-parser](https://github.com/timwis/node-soda2-parser), which
constructs a standard SQL query from the querystring parts, then parses it to an
[abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST)
using [node-sqlparser](https://github.com/alibaba/nquery). This logic resides in
its own package so that other layers can sit on top of it (such as
[soda-geoservices](https://github.com/timwis/soda-geoservices)), but that may be
more trouble than it's worth.

soda-carto applies a few changes to the parsed AST:

- Insert the table name as the `FROM` clause
- Add a default limit of `1000` if none is specified
- Select the geometry as GeoJSON if the output format is json, and as Well-known
  Text if the output format is csv
- Rename the geometry field, since Socrata datasets support arbitrary geometry
  field names and in carto, they're always called `the_geom`
- Convert Socrata's
  [convex_hull](https://dev.socrata.com/docs/functions/convex_hull.html),
  [within_box](https://dev.socrata.com/docs/functions/within_box.html),
  [within_circle](https://dev.socrata.com/docs/functions/within_circle.html), and
  [within_polygon](https://dev.socrata.com/docs/functions/within_polygon.html)
  functions to standard PostGIS

soda-carto then uses node-soda2-parser's `stringify` function to convert the
touched-up AST back to SQL. This logic is all wrapped by `handler.js`, which
handles an inbound HTTP request, translates it to a Carto/SQL query (as
described above), then _executes_ that query on a Carto API and passes on the
response. It also does a few other minor things:

- If the desired output format is json, it returns only the `rows` property of
  the Carto response, to match the response format you'd expect from a SODA API
- It uses a lookup file (`datasets.yml`) to match Socrata dataset IDs (ie.
  `sd09-aox1`) to the corresponding Carto table (this file must be populated
  manually)

The last layer is [serverless](https://serverless.com/), which uses a simple
YAML configuration file to deploy [AWS Lambda](https://aws.amazon.com/lambda/)
functions. `serverless.yml` defines the routes and delegates the handling to
`handler.js`.

## Usage
To run this yourself, `git clone` the repository and `npm install` the
dependencies. You'll also need to install serverless using `npm install --global
serverless`.

You can change the `CARTO_DOMAIN` inside `serverless.yml`, then
use `serverless deploy` to deploy the function to AWS Lambda. To view the logs,
check CloudWatch or use `serverless logs -f soda`.

There is also a local web server provided by `server.js`, but there isn't full
parity between that and what AWS Lambda would show; we need to rewire
`server.js` to simply delegate to `handler.js`.

## Feature support
The below table outlines the specific features identified in the [SODA2
docs](https://dev.socrata.com/docs/queries/). Features designated `auto` are
already PostgreSQL-compliant, so their support can be taken for granted.
Features marked `supported` have custom "translation" code written to make them
PostgreSQL/Carto-compliant. Features marked "todo" should be possible, but
require translation code to be written. Those marked "not supported" are likely
due to a shortcoming of the `node-sqlparser` library. Each feature should have a
[test](test/index.js) written.

| category | feature | example | support |
|----------|---------|---------|---------|
| $select | all fields | `$select=*` | auto |
| $select | comma-separated fields | `$select=foo, bar` | auto |
| $select | aliases | `$select=foo AS bar` | auto |
| $select | operators | `$select=foo * 2 AS double_foo` | auto |
| $select | count | `$select=count(*) AS count` | auto |
| $select | sum | `$select=sum(foo) AS total` | auto |
| $select | average | `$select=avg(foo)` | auto |
| $select | minimum | `$select=min(foo)` | auto |
| $select | maximum | `$select=max(foo)` | auto |
| $select | date truncation (y/ym/ymd) | `$select=date_trunc_ym(datetime) AS month` | todo |
| $select | convex_hull | `$select=convex_hull(location)` | supported |
| $select | case | `$select=case(type = 'A', 'Full', type = 'B', 'Partial')` | supported |
| $select | extent | `$select=extent(location)` | todo |
| $select | simplify | `$select=simplify(location, 0.001)` | todo |
| $select | number of vertices | `$select=num_points(location)` | todo |
| $select | distance in meters | `$select=distance_in_meters(location, 'POINT(-122.334540 47.59815)') AS range` | todo |
| $select | concatenate strings | `$select=foo` |  |
| $where | equality expression | `$where=foo = 'bar'` | auto |
| $where | AND operator | `$where=foo = 'bar' AND baz = 2` | auto |
| $where | parentheses | `$where=foo = 'bar' AND (baz = 2 OR baz = 3)` | auto |
| $where | operators | `$where=end - start < 3` | auto |
| $where | simple filters | `foo=bar&baz=1` | supported |
| $where | simple filters with $where clause | foo=bar&$where=baz = 1` | supported |
| $where | quotes within strings | `$where=foo = 'bob''s burgers'` | not supported |
| $where | quotes within simple filters | `$foo=bob's burgers` | supported |
| $where | boolean fields | `$where=foo = true` | auto |
| $where | boolean fields short-hand | `$where=foo` | auto |
| $where | in function | `$where=foo in ('bar', 'baz')` | auto |
| $where | not in function | `$where=foo not in ('bar', 'baz')` | auto |
| $where | between | `$where=foo between '100' and '200'` | auto |
| $where | not between | `$where=foo not between '100' and '200'` | not supported |
| $where | intersects | `$where=intersects(location, 'POINT (-12.3, 45.6)')` | supported |
| $where | starts with | `$where=starts_with(title, 'chief')` | todo |
| $where | within box | `$where=within_box(location, 47.5, -122.3, 47.5, -122.3)` | supported |
| $where | within circle | `$where=within_circle(location, 47.59815, -122.33454, 500)` | supported |
| $where | within polygon | `$where=within_polygon(location, 'MULTIPOLYGON (((-87.637714 41.887275, -87.613681 41.886892, -87.625526 41.871555, -87.637714 41.887275)))')` | supported |
| $where | record updated | `$where=:updated_at > '2017-02-19'` | not supported |
| $order | order by | `$order=foo` | auto |
| $order | order by with direction | `$order=foo DESC` | auto |
| $group | group by | `$group=foo` | auto |
| $group | group by truncated date | `$group=date_trunc_ym(datetime)` | todo |
| $having | having | `$select=count(*) AS count&$group=bar&$having=count > 20` | todo |
| $limit | limit | `$limit=10` | auto |
| $limit | default limit of 1000 | `$select=foo` | supported |
| $offset | offset | `$offset=5` | auto |
| $q | full-text search | `$q=foo` | todo |
| $q | stemming | `$q=users` | not supported |
| $q | multiple words are ANDed | `$q=test user` | todo |
| $query | soql query | `$query=SELECT * WHERE foo = 'bar'` | todo |
| $query | sub-query | `$query=SELECT city_feature, COUNT(*) AS count GROUP BY city_feature \| > SELECT COUNT(city_feature) AS num_types, SUM(count) AS total_features` | not supported |
| $jsonp | jsonp callback | `$jsonp=callback` | todo |

## See also
* [timothyclemansinsea/soql-for-cartodb](https://github.com/timothyclemansinsea/soql-for-cartodb)
