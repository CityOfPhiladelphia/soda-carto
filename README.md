# soda-carto [![Build
Status](https://travis-ci.org/timwis/soda-carto.svg?branch=master)](https://travis-ci.org/timwis/soda-carto)
Query [Carto](http://carto.com) datasets with a Socrata-style
[SODA2](https://dev.socrata.com/docs/queries/) API. Depends heavily on
[node-soda2-parser](https://github.com/timwis/node-soda2-parser), which is a
light wrapper around the [node-sqlparser](https://www.npmjs.com/package/node-sqlparse://www.npmjs.com/package/node-sqlparser)
AST parser.

## Install
1. Clone this repository
2. Install dependencies via `npm install`
3. Copy `.env.test` to `.env` and fill in the `CARTO_ENDPOINT` (ex. `https://phl-admin.carto.com/api/v2/`)
4. Run a server via `npm start`

## Usage
```
http://localhost:8080/resource/incidents?$select=*&$where=location_b = '100 BLOCK W GIRARD AVE'
```

## See also
* [timothyclemansinsea/soql-for-cartodb](https://github.com/timothyclemansinsea/soql-for-cartodb)

