import Request from '../../../utils/request';
import * as AuthMiddleware from '../../auth/authApiMiddleware';
import Survey from '../../../../core/survey/survey';
import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef';
import SurveyService from '../../survey/service/surveyService';
import NodeDefService from '../service/nodeDefService';
import {SurveyCycleKey} from '../../../../core/survey/_survey/surveyInfo'

const sendRespNodeDefs = async (res, surveyId, cycle: SurveyCycleKey, sendNodeDefs = false, draft = true, advanced = true, validate = true, nodeDefsUpdated = null) => {
  const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, draft, advanced, validate)

  res.json({
    nodeDefs: sendNodeDefs ? Survey.getNodeDefs(survey) : null,
    nodeDefsValidation: Survey.getNodeDefsValidation(survey),
    nodeDefsUpdated,
  })
}

export const init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/nodeDef', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const nodeDefRequest = Request.getBody(req) as INodeDef
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)

      await NodeDefService.insertNodeDef(user, surveyId, nodeDefRequest)

      const cycle = NodeDef.getCycleFirst(nodeDefRequest)
      await sendRespNodeDefs(res, surveyId, cycle)

    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get(`/survey/:surveyId/nodeDefs`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, draft, validate } = Request.getParams(req)
      const advanced = true // always fetch advanced props (TODO fetch only what is needed- now in dataentry min/max count are needed)
      const sendNodeDefs = true

      await sendRespNodeDefs(res, surveyId, cycle, sendNodeDefs, draft, advanced, validate)

    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/nodeDef/:nodeDefUuid/props', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { props, propsAdvanced } = Request.getBody(req)
      const { surveyId, cycle, nodeDefUuid } = Request.getParams(req)

      const nodeDefsUpdated = await NodeDefService.updateNodeDefProps(user, surveyId, nodeDefUuid, props, propsAdvanced)
      delete nodeDefsUpdated[nodeDefUuid]

      await sendRespNodeDefs(res, surveyId, cycle, false, true, true, true, nodeDefsUpdated)

    } catch (err) {
      next(err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId/nodeDef/:nodeDefUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, cycle, nodeDefUuid } = Request.getParams(req)

      await NodeDefService.markNodeDefDeleted(user, surveyId, nodeDefUuid)

      await sendRespNodeDefs(res, surveyId, cycle)

    } catch (err) {
      next(err)
    }
  })
};
