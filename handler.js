'use strict'
const request = require('request')
const url = require('url')
const convertRequest = require('./lib').convertRequest

const cartoDomain = process.env.CARTO_DOMAIN
const endpoint = url.resolve(cartoDomain, '/api/v2/sql')

module.exports.soda = (event, context, callback) => {
  const query = event.queryStringParameters || {}

  // Parse dataset and format from 's96x-w09z.json'
  const resource = event.pathParameters.resource
  const resourceParts = resource.split('.')
  const dataset = resourceParts[0]
  const format = resourceParts[1] || 'json'

  console.log(resource, query)

  // Convert soda request to SQL
  const sodaOpts = { dataset: dataset }
  if (format === 'csv') sodaOpts.geomFormat = 'wkt'
  const sql = convertRequest(query, sodaOpts)

  const requestOpts = {
    uri: endpoint,
    qs: {
      q: sql,
      format: format
    }
  }

  console.log(requestOpts)

  request(requestOpts, (err, resp, body) => {
    if (err) return callback(err)

    const response = {
      statusCode: resp.statusCode,
      body: resp.body
    }

    console.log(`Status code: ${resp.statusCode}`)
    callback(null, response)
  })
}
