'use strict'
const request = require('request')
const convertRequest = require('./lib').convertRequest

const endpoint = 'https://phl.carto.com/api/v2/'

module.exports.soda = (event, context, callback) => {
  const query = event.queryStringParameters || {}
  const opts = { dataset: event.pathParameters.dataset }
  const sql = convertRequest(query, opts)
  const cartoUrl = `${endpoint}sql?q=${encodeURIComponent(sql)}`

  // Request requires internet access
  // request(cartoUrl, callback)

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      cartoUrl: cartoUrl
    })
  }

  callback(null, response)
}
