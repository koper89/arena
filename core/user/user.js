import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as AuthGroup from '@core/auth/authGroup'

import { keys } from './_user/userKeys'
import * as UserPrefs from './_user/userPrefs'
import { userStatus } from './_user/userStatus'

export { keys } from './_user/userKeys'
export { userStatus } from './_user/userStatus'

export const keysPrefs = UserPrefs.keysPrefs

// ====== READ
export const isEqual = ObjectUtils.isEqual
export const getUuid = ObjectUtils.getUuid
export const getName = R.propOr('', keys.name)
export const getEmail = R.prop(keys.email)
export const getLang = R.propOr('en', keys.lang)
export const getAuthGroups = ObjectUtils.getAuthGroups
export const getPrefs = R.propOr({}, keys.prefs)
export const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)
export const getStatus = R.prop(keys.status)

// ====== CHECK
export const isSystemAdmin = user => user && R.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
export const hasAccepted = R.propEq(keys.status, userStatus.ACCEPTED)

// ====== AUTH GROUP
export const getAuthGroupBySurveyUuid = (surveyUuid, includeSystemAdmin = true) => user =>
  R.pipe(
    getAuthGroups,
    R.ifElse(
      R.always(includeSystemAdmin && isSystemAdmin(user)),
      R.head,
      R.find(group => AuthGroup.getSurveyUuid(group) === surveyUuid),
    ),
  )(user)

export const assocAuthGroups = R.assoc(keys.authGroups)

export const assocAuthGroup = authGroup => user =>
  R.pipe(getAuthGroups, R.append(authGroup), authGroups => assocAuthGroups(authGroups)(user))(user)

export const dissocAuthGroup = authGroup => user =>
  R.pipe(getAuthGroups, R.reject(R.propEq(AuthGroup.keys.uuid, AuthGroup.getUuid(authGroup))), authGroups =>
    assocAuthGroups(authGroups),
  )(user)

// PREFS
export const newPrefs = UserPrefs.newPrefs
export const getPrefSurveyCurrent = UserPrefs.getPrefSurveyCurrent
export const getPrefSurveyCycle = UserPrefs.getPrefSurveyCycle
export const getPrefSurveyCurrentCycle = UserPrefs.getPrefSurveyCurrentCycle

export const assocPrefSurveyCurrent = UserPrefs.assocPrefSurveyCurrent
export const assocPrefSurveyCycle = UserPrefs.assocPrefSurveyCycle
export const assocPrefSurveyCurrentAndCycle = UserPrefs.assocPrefSurveyCurrentAndCycle

export const deletePrefSurvey = UserPrefs.deletePrefSurvey
