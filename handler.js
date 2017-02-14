'use strict'
const request = require('request')
const url = require('url')
const pick = require('lodash/pick')
const fs = require('fs')
const yaml = require('js-yaml')
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
  const sodaOpts = {
    dataset: matchedDataset.carto_table || path.dataset, // if no match, use as table name
    geomAlias: matchedDataset.geometry_field || null, // defaults to the_geom_geojson
    geomFormat: (path.format === 'csv') ? 'wkt' : null // defaults to geojson
  }
  const sql = convertRequest(query, sodaOpts)

  const requestOpts = {
    uri: endpoint,
    qs: {
      q: sql,
      format: path.format
    }
  }

  console.log(requestOpts)

  request(requestOpts, (err, response) => {
    if (err) return callback(err)

    const headersToKeep = ['content-type', 'access-control-allow-origin', 'access-control-allow-headers']
    const payload = {
      statusCode: response.statusCode,
      headers: pick(response.headers, headersToKeep)
    }
    if (path.format !== 'json') {
      // Only tell browser to download if it's not JSON
      payload.headers['content-disposition'] = response.headers['content-disposition']
    }

    if (path.format === 'json' && response.statusCode === 200) {
      payload.body = parseResponseRows(response.body)
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

function parseResponseRows (body) {
  try {
    const parsedBody = JSON.parse(body)
    return JSON.stringify(parsedBody.rows || parsedBody) // fallback if no rows property
  } catch (e) {
    console.error('Failed to parse response json')
  }
}
