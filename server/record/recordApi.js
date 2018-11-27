const R = require('ramda')
const path = require('path')

const {getRestParam} = require('../serverUtils/request')
const {sendErr, sendOk} = require('../serverUtils/response')

const RecordManager = require('./recordManager')
const recordThreadMessageTypes = require('./recordThreadMessageTypes')
const Node = require('../../common/record/node')

const UserThreadsCache = require('../threads/userThreadsCache')
const Thread = require('../threads/thread')
const WebSocketManager = require('../webSocket/webSocketManager')
const {recordEvents} = require('../../common/webSocket/webSocketEvents')

const recordUpdateUserThreads = new UserThreadsCache()

const createRecordUpdateThread = (userId) => {
  const thread = new Thread(
    path.resolve(__dirname, 'recordUpdateThread.js'),
    {},
    nodes => WebSocketManager.notifyUser(userId, recordEvents.nodesUpdate, nodes),
    () => recordUpdateUserThreads.removeUserThread(userId)
  )

  recordUpdateUserThreads.putUserThread(userId, thread)

  return thread
}

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', async (req, res) => {
    try {
      const {user} = req
      const recordReq = req.body

      if (recordReq.ownerId !== user.id) {
        throw new Error('Error record create. User is different')
      }

      const record = await RecordManager.createRecord(recordReq)

      createRecordUpdateThread(user.id)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/record/:recordId/node', async (req, res) => {
    try {
      const user = req.user
      const node = JSON.parse(req.body.node)
      const file = R.path(['files', 'file'])(req)

      const surveyId = getRestParam(req, 'surveyId')

      const updateWorker = recordUpdateUserThreads.getUserThread(user.id)

      updateWorker.postMessage({type: recordThreadMessageTypes.updateNode, surveyId, node, file})

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')

      const count = await RecordManager.countRecordsBySurveyId(surveyId)
      res.json(count)

    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/records', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const limit = getRestParam(req, 'limit')
      const offset = getRestParam(req, 'offset')

      const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, offset, limit)
      res.json(recordsSummary)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordId', async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      const record = await RecordManager.fetchRecordById(surveyId, recordId)

      createRecordUpdateThread(user.id)

      res.json({record})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/record/:recordId/nodes/:nodeUUID/file', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUUID = getRestParam(req, 'nodeUUID')

      const node = await RecordManager.fetchNodeFileByUUID(surveyId, nodeUUID)
      const value = Node.getNodeValue(node)

      res.setHeader('Content-disposition', `attachment; filename=${value.fileName}`)
      // res.set('Content-Type', 'text/csv')

      res.write(node.file, 'binary')
      res.end(null, 'binary')
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  // ==== DELETE
  app.delete('/survey/:surveyId/record/:recordId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const recordId = getRestParam(req, 'recordId')

      await RecordManager.deleteRecord(surveyId, recordId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.delete('/survey/:surveyId/record/:recordId/node/:nodeUUID', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const nodeUUID = getRestParam(req, 'nodeUUID')

      const nodes = await RecordManager.deleteNode(surveyId, nodeUUID)
      res.json({nodes})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UTILS
  app.post('/survey/:surveyId/record/:recordId/checkout', async (req, res) => {
    try {
      const user = req.user

      const updateWorker = recordUpdateUserThreads.getUserThread(user.id)

      updateWorker.postMessage({type: recordThreadMessageTypes.disconnect})

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })
}
