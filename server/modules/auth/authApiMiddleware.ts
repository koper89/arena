import Request from '../../utils/request';
import SurveyManager from '../survey/manager/surveyManager';
import RecordService from '../record/service/recordService';
import UserService from '../user/service/userService';
import Authorizer from '../../../core/auth/authorizer';
import Survey from '../../../core/survey/survey';
import UnauthorizedError from '../../utils/unauthorizedError';

const checkPermission = (req, next, permissionFn, ...args) => {
  const user = Request.getUser(req)

  if (permissionFn(user, ...args)) {
    next()
  } else {
    next(new UnauthorizedError(user && user.name))
  }

}

const requireSurveyPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId } = Request.getParams(req)
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const surveyInfo = Survey.getSurveyInfo(survey)

    checkPermission(req, next, permissionFn, surveyInfo)
  } catch (e) {
    next(e)
  }
}

const requireRecordPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId, recordUuid } = Request.getParams(req)

    const record = await RecordService.fetchRecordByUuid(surveyId, recordUuid)

    checkPermission(req, next, permissionFn, record)
  } catch (e) {
    next(e)
  }
}

const requireUserPermission = permissionFn => async (req, res, next) => {
  try {
    const { surveyId, userUuid } = Request.getParams(req)
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const user = await UserService.fetchUserByUuid(userUuid)

    checkPermission(req, next, permissionFn, surveyInfo, user)
  } catch (e) {
    next(e)
  }
}

// Survey
export const requireSurveyViewPermission = requireSurveyPermission(Authorizer.canViewSurvey)
export const requireSurveyEditPermission = requireSurveyPermission(Authorizer.canEditSurvey)

// Record
export const requireRecordListViewPermission = requireSurveyPermission(Authorizer.canViewSurvey)
export const requireRecordCreatePermission = requireSurveyPermission(Authorizer.canCreateRecord)
export const requireRecordEditPermission = requireRecordPermission(Authorizer.canEditRecord)
export const requireRecordViewPermission = requireSurveyPermission(Authorizer.canViewRecord)
export const requireRecordAnalysisPermission = requireSurveyPermission(Authorizer.canAnalyzeRecords)

// User
export const requireUserInvitePermission = requireSurveyPermission(Authorizer.canInviteUsers)
export const requireUserViewPermission = requireUserPermission(Authorizer.canViewUser)
export const requireUserEditPermission = requireUserPermission(Authorizer.canEditUser)
export const requireUserRemovePermission = requireUserPermission(Authorizer.canRemoveUser)
