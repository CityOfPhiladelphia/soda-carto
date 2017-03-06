const http = require('http')
const url = require('url')
const serverRouter = require('server-router')
const request = require('request')
require('dotenv').load({ silent: true })

const handler = require('./handler').soda

const port = process.env.PORT || 8080

const router = serverRouter([
  ['/resource/:resource', resourceHandler]
])

http.createServer((req, res) => router(req, res)).listen(port)

function resourceHandler (req, res, params) {
  const query = url.parse(req.url, true).query

  const event = {
    pathParameters: params,
    queryStringParameters: query
  }

  handler(event, {}, function (err, payload) {
    if (err) {
      console.log(err)
      res.statusCode = 500
      res.end()
    }

    res.statusCode = payload.statusCode
    res.headers = payload.headers
    res.end(payload.body)
  })
}

