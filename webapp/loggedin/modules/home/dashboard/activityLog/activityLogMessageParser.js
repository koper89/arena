import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessage from './activityLogMessage'

import i18nMessageParamsFnsSurvey from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsSurvey'
import i18nMessageParamsFnsCategory from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsCategory'
import i18nMessageParamsFnsTaxonomy from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsTaxonomy'

import isItemDeletedFnsSurvey from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsSurvey'
import isItemDeletedFnsCategory from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsCategory'
import isItemDeletedFnsTaxonomy from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsTaxonomy'

const i18nMessageParamsFns = {
  ...i18nMessageParamsFnsSurvey,
  ...i18nMessageParamsFnsCategory,
  ...i18nMessageParamsFnsTaxonomy,
}

const isItemDeletedFns = {
  ...isItemDeletedFnsSurvey,
  ...isItemDeletedFnsCategory,
  ...isItemDeletedFnsTaxonomy,
}

export const toMessage = (i18n, survey) => activityLog => {
  const type = ActivityLog.getType(activityLog)

  const i18nMessageParamsFn = i18nMessageParamsFns[type]
  const i18nMessageParams = i18nMessageParamsFn ? i18nMessageParamsFn(survey)(activityLog) : {}
  const message = i18n.t(`activityLogView.messages.${type}`, i18nMessageParams)

  const isItemDeletedFn = isItemDeletedFns[type]
  const itemDeleted = isItemDeletedFn && isItemDeletedFn(survey)(activityLog)

  return ActivityLogMessage.newMessage(activityLog, message, itemDeleted)
}