'use strict'
const request = require('request')
const convertRequest = require('./lib').convertRequest

const endpoint = 'https://phl.carto.com/api/v2/'

module.exports.soda = (event, context, callback) => {
  const query = event.queryStringParameters || {}
  const opts = { dataset: event.pathParameters.dataset }
  const sql = convertRequest(query, opts)
  const cartoUrl = `${endpoint}sql?q=${encodeURIComponent(sql)}`

  request(cartoUrl, (err, resp, body) => {
    if (err) return callback(err)

    // the lambda callback can't seem to handle all the properties that
    // the request module returns in `resp`
    const response = {
      statusCode: resp.statusCode,
      body: resp.body
    }

    callback(null, response)
  })
}
