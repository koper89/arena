const Request = require('../../../utils/request')
const { sendOk, sendFile } = require('../../../utils/response')

const User = require('../../../../core/user/user')
const Record = require('../../../../core/record/record')
const RecordFile = require('../../../../core/record/recordFile')
const Node = require('../../../../core/record/node')

const RecordService = require('../service/recordService')
const FileService = require('../service/fileService')

const {
  requireRecordListViewPermission,
  requireRecordEditPermission,
  requireRecordCreatePermission,
  requireRecordViewPermission,
} = require('../../auth/authApiMiddleware')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/record', requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const record = Request.getBody(req)
      const socketId = Request.getSocketId(req)

      if (Record.getOwnerUuid(record) !== User.getUuid(user)) {
        throw new Error('Error record create. User is different')
      }

      await RecordService.createRecord(socketId, user, surveyId, record)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/node', requireRecordEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const node = Request.getJsonParam(req, 'node')
      const file = Request.getFile(req)
      const socketId = Request.getSocketId(req)

      await RecordService.persistNode(socketId, user, surveyId, node, file)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/records/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const count = await RecordService.countRecordsBySurveyId(surveyId, cycle)
      res.json(count)

    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/records', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, limit, offset } = Request.getParams(req)

      const recordsSummary = await RecordService.fetchRecordsSummaryBySurveyId(surveyId, cycle, offset, limit)
      res.json(recordsSummary)
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/records/summary/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, from, to } = Request.getParams(req)

      const counts = await RecordService.fetchRecordCreatedCountsByDates(surveyId, cycle, from, to)

      res.json(counts)
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file', requireRecordViewPermission, async (req, res, next) => {
    try {
      const { surveyId, nodeUuid } = Request.getParams(req)

      const node = await RecordService.fetchNodeByUuid(surveyId, nodeUuid)
      const file = await FileService.fetchFileByUuid(surveyId, Node.getFileUuid(node))

      sendFile(res, RecordFile.getName(file), RecordFile.getContent(file), RecordFile.getSize(file))
    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  // RECORD promote / demote
  app.post('/survey/:surveyId/record/:recordUuid/step', requireRecordEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid, step } = Request.getParams(req)

      await RecordService.updateRecordStep(surveyId, recordUuid, step)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  // RECORD Check in / out
  app.post('/survey/:surveyId/record/:recordUuid/checkin', requireRecordViewPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid, draft } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      const record = await RecordService.checkIn(socketId, user, surveyId, recordUuid, draft)

      res.json({ record })
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/record/:recordUuid/checkout', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, recordUuid } = Request.getParams(req)
      const socketId = Request.getSocketId(req)

      await RecordService.checkOut(socketId, user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/record/:recordUuid', requireRecordEditPermission, async (req, res, next) => {
    try {
      const { surveyId, recordUuid } = Request.getParams(req)
      const user = Request.getUser(req)
      const socketId = Request.getSocketId(req)

      await RecordService.deleteRecord(socketId, user, surveyId, recordUuid)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  app.delete('/survey/:surveyId/record/:recordUuid/node/:nodeUuid', requireRecordEditPermission, (req, res) => {
    const { surveyId, recordUuid, nodeUuid } = Request.getParams(req)
    const user = Request.getUser(req)
    const socketId = Request.getSocketId(req)

    RecordService.deleteNode(socketId, user, surveyId, recordUuid, nodeUuid)
    sendOk(res)
  })

}
