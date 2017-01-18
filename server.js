const http = require('http')
const url = require('url')
const serverRouter = require('server-router')
const request = require('request')
require('dotenv').load({ silent: true })

const convertRequest = require('./lib').convertRequest

const endpoint = process.env.CARTO_ENDPOINT
const port = process.env.PORT || 8080

const router = serverRouter([
  ['/resource/:resource', resourceHandler]
])

http.createServer((req, res) => router(req, res).pipe(res)).listen(port)

function resourceHandler (req, res, params) {
  const query = url.parse(req.url, true).query
  const opts = { dataset: params.resource }
  const sql = convertRequest(query, opts)
  const cartoUrl = `${endpoint}sql?q=${sql}`

  res.setHeader('Content-Type', 'application/json')
  return request(cartoUrl)
}

