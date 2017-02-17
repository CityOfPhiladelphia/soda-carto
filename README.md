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

## See also
* [timothyclemansinsea/soql-for-cartodb](https://github.com/timothyclemansinsea/soql-for-cartodb)

