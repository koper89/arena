const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const Log = require('../log/log')

const headerMiddleware = require('./middleware/headerMiddleware')
const jwtMiddleware = require('./middleware/jwtMiddleware')
const errorMiddleware = require('./middleware/errorMiddleware')
const authApi = require('../modules/auth/api/authApi')
const apiRouter = require('./apiRouter')
const WebSocket = require('../utils/webSocket')
const RecordPreviewCleanup = require('./recordPreviewCleanup')
const ExpiredJwtTokensCleanup = require('./expiredJwtTokensCleanup')
const I18n = require('../system/middleware/i18nMiddleware')

module.exports = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info(`server initialization start`)

  const app = express()

  // ====== app initializations
  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(fileUpload({
    // limit upload to 1 GB
    limits: { fileSize: 1024 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/arena-upload',
  }))

  headerMiddleware.init(app)

  app.use(/^\/api.*|^\/auth.*/, jwtMiddleware)

  app.use(compression({ threshold: 512 }))

  app.use(/^\/$/, (req, res) => res.redirect('/app/home'))

  app.use('/', express.static(`${__dirname}/../../dist`))
  app.use('/app*', express.static(`${__dirname}/../../dist`))
  app.use('/img/', express.static(`${__dirname}/../../web-resources/img`))
  // app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

  // i18n
  I18n.init(app)

  // ====== apis
  authApi.init(app)
  app.use('/api', apiRouter.router)

  // ====== error handling
  errorMiddleware.init(app)

  // ====== server
  const httpServerPort = process.env.PORT || '9090'

  const server = app.listen(httpServerPort, () => {
    logger.info(`server initialization end - listening on port ${httpServerPort}`)
  })

  // ====== socket middleware
  WebSocket.init(server, jwtMiddleware)

  // ====== schedulers
  await RecordPreviewCleanup.init()
  await ExpiredJwtTokensCleanup.init()
}