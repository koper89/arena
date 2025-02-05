import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  info: 'info',
  ownerUuid: 'ownerUuid',
  draft: 'draft',
  published: 'published',
  authGroups: 'authGroups',
  props: ObjectUtils.keys.props,
  // Props
  collectUri: 'collectUri',
  collectReport: 'collectReport',
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  languages: 'languages',
  srs: 'srs',
  steps: 'steps',
}

export const collectReportKeys = {
  issuesTotal: 'issuesTotal',
  issuesResolved: 'issuesResolved',
}

export const cycleOneKey = '0'

export const getInfo = R.propOr({}, keys.info)

// ====== READ surveyInfo
export const getId = ObjectUtils.getId

export const getUuid = ObjectUtils.getUuid

export const getName = ObjectUtils.getProp(keys.name, '')

export const getDescriptions = ObjectUtils.getProp(keys.descriptions, {})

export const isPublished = R.propEq(keys.published, true)

export const isDraft = R.propEq(keys.draft, true)

export const getLanguages = ObjectUtils.getProp(keys.languages, [])

export const getDefaultLanguage = R.pipe(getLanguages, R.head)

export const getLabels = ObjectUtils.getProp(keys.labels, {})

export const getDefaultLabel = surveyInfo => {
  const labels = getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

export const getLabel = (surveyInfo, lang) => {
  const label = ObjectUtils.getLabel(lang)(surveyInfo)
  return StringUtils.isBlank(label) ? getName(surveyInfo) : label
}

export const getSRS = ObjectUtils.getProp(keys.srs, [])

export const getDefaultSRS = R.pipe(getSRS, R.head)

export const getStatus = surveyInfo =>
  isPublished(surveyInfo) && isDraft(surveyInfo)
    ? 'PUBLISHED-DRAFT'
    : isPublished(surveyInfo)
    ? 'PUBLISHED'
    : isDraft(surveyInfo)
    ? 'DRAFT'
    : ''

export const getCycles = ObjectUtils.getProp(keys.cycles)

export const getCycleKeys = R.pipe(getCycles, R.keys)

export const getDateCreated = ObjectUtils.getDateCreated

export const getDateModified = ObjectUtils.getDateModified

export const getCollectUri = ObjectUtils.getProp(keys.collectUri)

export const getCollectReport = ObjectUtils.getProp(keys.collectReport, {})

export const hasCollectReportIssues = R.pipe(
  getCollectReport,
  R.propSatisfies(total => total > 0, collectReportKeys.issuesTotal),
)

export const isFromCollect = R.pipe(getCollectUri, R.isNil, R.not)

export const getLanguage = preferredLang => surveyInfo =>
  R.pipe(getLanguages, R.find(R.equals(preferredLang)), R.defaultTo(getDefaultLanguage(surveyInfo)))(surveyInfo)

// ====== UPDATE
export const markDraft = R.assoc(keys.draft, true)

// ====== UTILS

export const isValid = surveyInfo => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

export const getAuthGroups = ObjectUtils.getAuthGroups

const _getAuthGroupByName = name => R.pipe(getAuthGroups, R.find(R.propEq(AuthGroup.keys.name, name)))

export const getAuthGroupAdmin = _getAuthGroupByName(AuthGroup.groupNames.surveyAdmin)

export const isAuthGroupAdmin = group => surveyInfo => AuthGroup.isEqual(group)(getAuthGroupAdmin(surveyInfo))
