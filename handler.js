'use strict'
const request = require('request')
const url = require('url')
const pick = require('lodash/pick')
const fs = require('fs')
const yaml = require('js-yaml')
const xml = require('to-xml').toXML
const convertRequest = require('./lib').convertRequest

const cartoDomain = process.env.CARTO_DOMAIN
const endpoint = url.resolve(cartoDomain, '/api/v2/sql')
const datasets = loadDatasets('./datasets.yml')

module.exports.soda = (event, context, callback) => {
  const path = parsePath(event.pathParameters)
  const query = event.queryStringParameters || {}
  console.log(event.pathParameters, query)

  // Convert soda request to SQL
  const matchedDataset = datasets[path.dataset] || {}
  const geomFormat = (path.format === 'csv' || path.format === 'xml') ? 'wkt' : null // defaults to geojson
  const requestFormat = (path.format === 'xml') ? 'json' : path.format // only change this if it's xml
  const sodaOpts = {
    dataset: matchedDataset.carto_table || path.dataset, // if no match, use as table name
    geomAlias: matchedDataset.geometry_field || null, // defaults to the_geom_geojson
    geomFormat: geomFormat
  }
  const sql = convertRequest(query, sodaOpts)

  const requestOpts = {
    uri: endpoint,
    qs: {
      q: sql,
      format: requestFormat
    }
  }

  console.log(requestOpts)

  request(requestOpts, (err, response) => {
    if (err) return callback(err)

    const headers = pick(response.headers, ['content-type', 'access-control-allow-origin', 'access-control-allow-headers'])
    headers['X-SODA-Carto-Query'] = sql // pass translated query for debug purposes

    const payload = {
      statusCode: response.statusCode,
      headers: headers
    }

    if (path.format !== 'json' && path.format !== 'xml') {
      // Only tell browser to download if it's not JSON or XML
      payload.headers['content-disposition'] = response.headers['content-disposition']
    }

    if (path.format === 'xml') {
      payload.headers['content-type'] = 'text/xml'
    }

    if ((path.format === 'json' || path.format === 'xml') && response.statusCode === 200) {
      const parsedBody = deserializeJSON(response.body)
      const rows = parsedBody.rows || parsedBody // fallback if no rows property
      if (path.format === 'json') {
        payload.body = serializeJSON(numbersToStrings(rows))
      } else if (path.format === 'xml') {
        payload.body = serializeXML(rows)
      }
    } else {
      // If statusCode !== 200, there's no rows property anyway
      payload.body = response.body
    }

    console.log(`Status code: ${response.statusCode}`)
    callback(null, payload)
  })
}

function loadDatasets (path) {
  try {
    return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
  } catch (e) {
    console.error(`Error reading datasets.yml`)
  }
}

// Parse dataset and format from 's96x-w09z.json' or 's96x-w09z' and 'rows.json'
function parsePath (params) {
  const parsed = {}
  if (params.format) {
    parsed.dataset = params.resource
    parsed.format = params.format.replace('rows.', '') // remove prefix
  } else {
    const resourceParts = params.resource.split('.')
    parsed.dataset = resourceParts[0]
    parsed.format = resourceParts[1] || 'json'
  }
  return parsed
}

function deserializeJSON (body) {
  try {
    return JSON.parse(body)
  } catch (err) {
    console.error('Failed to parse response json')
  }
}

function serializeJSON (rows) {
  try {
    return JSON.stringify(rows)
  } catch (err) {
    console.error('Failed to serialize response json')
  }
}

function serializeXML (rows) {
  try {
    const xmlRows = xml({ row: rows }) // wraps each row in row property
    // Wrap it with a string because the xml lib isn't clever enough
    return '<response><rows>' + xmlRows + '</rows></response>'
  } catch (err) {
    console.error('Failed to serialize response xml')
  }
}

function numbersToStrings (rows) {
  for (var i in rows) {
    for (var k in rows[i]) {
      if (typeof rows[i][k] == 'number')
        rows[i][k] = rows[i][k].toString()
    }
  }
  return rows
}
