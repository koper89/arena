const Log = require('../log/log')

const logger = Log.getLogger('DB')

const ProcessUtils = require('../../core/processUtils')

const debugOptions = {
  query: (e) => {
    logger.debug(`QUERY: ${e.query}`)
    if (e.params) {
      logger.debug(`PARAMS: ${JSON.stringify(e.params)}`)
    }
  }
}

// const pgp = require('pg-promise')(debugOptions)
const pgp = require('pg-promise')({})

const configCommon = {
  // how long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // max number of clients in the pool
  max: 10,
  // whether to use ssl connections
  ssl: ProcessUtils.ENV.pgSsl
}

const config = ProcessUtils.ENV.dbUrl
  ? {
    connectionString: ProcessUtils.ENV.dbUrl,
    ...configCommon
  }
  : {
    user: ProcessUtils.ENV.pgUser,
    database: ProcessUtils.ENV.pgDatabase,
    password: ProcessUtils.ENV.pgPassword,
    host: ProcessUtils.ENV.pgHost,
    port: ProcessUtils.ENV.pgPort,
    ...configCommon
  }

const db = pgp(config)

module.exports = db