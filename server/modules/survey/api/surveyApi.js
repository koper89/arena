import * as R from 'ramda'

import * as Response from '@server/utils/response'
import * as Request from '@server/utils/request'
import * as JobUtils from '@server/job/jobUtils'

import * as Validation from '@core/validation/validation'
import * as User from '@core/user/user'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyService from '../service/surveyService'
import * as UserService from '../../user/service/userService'

export const init = app => {
  // ==== CREATE
  app.post('/survey', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyReq = Request.getBody(req)
      const validation = await SurveyService.validateNewSurvey(surveyReq)

      if (Validation.isValid(validation)) {
        const survey = await SurveyService.createSurvey(user, {
          ...surveyReq,
          languages: [surveyReq.lang],
        })

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (error) {
      next(error)
    }
  })

  // ==== READ
  app.get('/surveys', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { offset, limit } = Request.getParams(req)

      const list = await SurveyService.fetchUserSurveysInfo(user, offset, limit)

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/surveys/count', async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const count = await SurveyService.countUserSurveys(user)

      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const user = R.pipe(Request.getUser, User.assocPrefSurveyCurrent(surveyId))(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyById(surveyId, draft, validate),
        UserService.updateUserPrefs(user),
      ])

      res.json({ survey })
    } catch (error) {
      next(error)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/info', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const props = Request.getBody(req)

      const { surveyId } = Request.getParams(req)

      const survey = await SurveyService.updateSurveyProps(user, surveyId, props)

      res.json(survey)
    } catch (error) {
      next(error)
    }
  })

  app.put('/survey/:surveyId/publish', AuthMiddleware.requireSurveyEditPermission, (req, res) => {
    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)

    const job = SurveyService.startPublishJob(user, surveyId)

    res.json({ job: JobUtils.jobToJSON(job) })
  })

  // ==== DELETE

  app.delete('/survey/:surveyId', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      await SurveyService.deleteSurvey(surveyId)

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
