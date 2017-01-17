const test = require('tape')
const convertRequest = require('../lib').convertRequest

const queries = require('./queries')

queries
  .filter((query) => !query.skip)
  .forEach((query) => {
    test(query.label, (t) => {
      t.plan(1)
      const sql = convertRequest(null, query.input)
      t.equal(sql, query.expect)
    })
  })
