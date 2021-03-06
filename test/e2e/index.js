const async = require('async'),
      request = require('request'),
      yaml = require('js-yaml'),
      fs = require('fs'),
      winston = require('winston'),
      shuffle = require('knuth-shuffle').knuthShuffle,
      assert = require('assert')

const concurrency = 1
const maxNon200 = 5

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function () {
        return new Date().toISOString()
      },
      formatter: function (options) {
        // Return string will be passed to logger.
        return '[' + options.timestamp() + '] ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ]
})

function bucketStatus(status) {
  if (status >= 200 && status < 300)
    return '2xxs'
  if (status >= 300 && status < 400)
    return '3xxs'
  if (status >= 400 && status < 500)
    return '4xxs'
  if (status >= 500 && status < 600)
    return '5xxs'

  throw Exception('Unkown status: ' + status)
}

function reportRequestStats(name, rawStats) {
  count = rawStats.length

  stats = rawStats.reduce(function (acc, row) {
    acc[bucketStatus(row.status)]++

    acc.avg_bytes_per_ms_acc += row.bytes / row.timing
    acc.avg_time_elapsed_acc += row.timing
    acc.total_bytes += row.bytes

    return acc
  },
  {
    '2xxs': 0,
    '3xxs': 0,
    '4xxs': 0,
    '5xxs': 0,
    avg_bytes_per_ms_acc: 0,
    avg_time_elapsed_acc: 0,
    total_bytes: 0
  })

  stats.avg_bytes_per_ms = stats.avg_bytes_per_ms_acc / count
  stats.avg_time_elapsed = stats.avg_time_elapsed_acc / count

  logger.info('%s - 200s: %d, 300s: %d, 400s: %d, 500s: %d, avg bytes/ms: %d, avg time (ms) %d, total bytes: %d',
              name,
              stats['2xxs'],
              stats['3xxs'],
              stats['4xxs'],
              stats['5xxs'],
              stats.avg_bytes_per_ms,
              stats.avg_time_elapsed,
              stats.total_bytes)
}

function gatewayTests(testQueriesRaw) {
  logger.info('Executing gateway test queries')

  non200Count = 0

  var testQueries = []

  if (testQueriesRaw.socrata)
    testQueriesRaw.socrata.forEach(function (query) {
      query.type = 'socrata'
      testQueries.push(query)
    })

  if (testQueriesRaw.carto)
    testQueriesRaw.carto.forEach(function (query) {
      testQueries.push({ type: 'carto', query: query })
    })

  testQueries = shuffle(testQueries)

  function runQuery(query, callback) {
    options = {}
    if (query.type == 'socrata') {
      options.url = 'https://data.phila.gov/resource/' + query.dataset + '.json'
      options.qs = query.query
    } else if (query.type == 'carto') {
      options.url = 'https://phl.carto.com/api/v2/sql?q=' + query.query
    } else {
      throw Exception('`' + query.type + '` not supported')
    }

    logger.info('Executing: %s', JSON.stringify(options))

    var start = Date.now()

    request(options, function (err, res, body) {
      if (err) return callback(err)

      var end = Date.now()

      var status = res.statusCode, bytes = body.length

      logger.info('Response: %d, Bytes: %d', status, bytes)

      if (status != 200)
        non200Count++

      // if (non200Count >= maxNon200)
      //   callback('Max non-200 response reached')

      callback(null, {
        type: query.type,
        status: status,
        bytes: bytes,
        timing: end - start
      })
    })
  }

  function reportResults(err, rawStats) {
    if (err) return logger.error(err)

    reportRequestStats('gateway', rawStats)
  }

  async.mapLimit(testQueries,
                 concurrency,
                 runQuery,
                 reportResults)
}

function socrataTests(testQueriesRaw) {
  logger.info('Executing Scorata comparison test queries')

  var datasets = yaml.safeLoad(fs.readFileSync(__dirname + '/../../datasets.yml', 'utf8'));

  var testQueries = []
  for (var dataset in datasets) {
    testQueries.push({
      type: 'socrata',
      dataset: dataset,
      query: {
        $limit: 10
      }
    })
  }

  non200Count = 0

  // var testQueries = []
  // testQueriesRaw.socrata.forEach(function (query) {
  //   query.type = 'socrata'
  //   testQueries.push(query)
  // })
  // testQueries = shuffle(testQueries)

  function compareDatasets(socrataKey, socrata, carto) {
    if (socrata == undefined || socrata == '') {
      logger.error('socrata undefined')
      return
    }
    if (carto == undefined || carto == '') {
      logger.error('carto undefined')
      return
    }
    socrata = JSON.parse(socrata)
    carto = JSON.parse(carto)
    logger.info(socrata)
    logger.info(carto)
    if (socrata == undefined) {
      logger.error('socrata undefined')
      return
    }
    if (carto == undefined) {
      logger.error('carto undefined')
      return
    }
    if (socrata.length != carto.length) {
      logger.error('`' + socrataKey + '` length is not the same ' +
        socrata.length + ' - ' + carto.length)
      return
    }
    for (var i in socrata) {
      // console.log(socrata[i])
      // console.log(carto[i])
      Object.keys(socrata[i]).forEach(function (socrataKey) {
        if (!socrataKey in carto[i])
          logger.error('`' + socrataKey + '` not in carto')
        socrataType = typeof socrata[i][socrataKey]
        cartoType = typeof carto[i][socrataKey]
        if (socrata[i][socrataKey] != null && carto[i][socrataKey] != null && socrataType != cartoType)
          logger.error('`' + socrataKey + '` type mismatch socrata: ' + socrata[i][socrataKey] + ' (' +
                       socrataType + ') carto: ' + carto[i][socrataKey] + ' (' + cartoType + ')')
      })
    }
  }

  function runQuery(query, callback) {
    logger.info('Testing dataset: ' + query.dataset)

    async.series({
      socrata: function (callback) {
        options = {
          url: 'https://data.phila.gov/resource/' + query.dataset + '.json',
          qs: query.query
        }

        logger.info('Executing against Socrata: %s', JSON.stringify(options))

        var start = Date.now()
        request(options, function (err, res, body) {
          if (err) return callback(err)

          var end = Date.now()

          var status = res.statusCode, bytes = body.length

          logger.info('Response: %d, Bytes: %d', status, bytes)

          if (status != 200)
            non200Count++

          // if (non200Count >= maxNon200)
          //   callback('Max non-200 response reached')

          // TODO: use stream?
          // TODO: save body to temp file for comparison?

          callback(null, {
            type: query.type,
            status: status,
            bytes: bytes,
            timing: end - start,
            body: body
          })
        })
      },
      carto: function (callback) {
        options = {
          url: 'http://localhost:8080/resource/' + query.dataset + '.json',
          qs: query.query
        }

        logger.info('Executing against Carto: %s', JSON.stringify(options))

        var start = Date.now()
        request(options, function (err, res, body) {
          if (err) return callback(err)

          var end = Date.now()

          var status = res.statusCode, bytes = body.length

          logger.info('Response: %d, Bytes: %d', status, bytes)

          if (status != 200)
            non200Count++

          // if (non200Count >= maxNon200)
          //   callback('Max non-200 response reached')

          // TODO: use stream?
          // TODO: save body to temp file for comparison?

          callback(null, {
            type: query.type,
            status: status,
            bytes: bytes,
            timing: end - start,
            body: body
          })
        })
      }
    },
    function (err, results) {
      if (err) return callback(err)

      compareDatasets(query.dataset, results.socrata.body,results.carto.body)

      delete results.socrata.body
      delete results.carto.body

      callback(err, results)
    })
  }

  function reportResults(err, results) {
    if (err) return logger.error(err)

    console.log(results)

    groupedResults = results.reduce({}, function (result) {
      acc.socrata.push(result.socrata)
      acc.carto.push(result.carto)
      return acc
    },
    {
      socrata: [],
      carto: []
    })

    reportRequestStats('converter socrata', groupedResults.socrata)
    reportRequestStats('converter carto', groupedResults.cart)
  }

  async.mapLimit(testQueries,
                 concurrency,
                 runQuery,
                 reportResults)
}

function main() {
  logger.info('Loading query yaml file')

  var testQueriesRaw = yaml.safeLoad(fs.readFileSync(__dirname + '/e2eQueries.yml', 'utf8'));

  //gatewayTests(testQueriesRaw)

  // if (testQueriesRaw.socrata)
  //   socrataTests(testQueriesRaw)

  socrataTests()
}

main()
