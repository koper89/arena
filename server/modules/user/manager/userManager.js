import * as R from 'ramda'

import { db } from '@server/db/db'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserRepository from '@server/modules/user/repository/userRepository'

// ==== CREATE
export const insertUser = async (user, surveyId, surveyCycleKey, email, password, status, groupUuid, client = db) =>
  await client.tx(async t => {
    const newUser = await UserRepository.insertUser(surveyId, surveyCycleKey, email, password, status, t)
    await addUserToGroup(user, surveyId, groupUuid, newUser, t)
  })

export const addUserToGroup = async (user, surveyId, groupUuid, userToAdd, client = db) =>
  await client.tx(async t => {
    await AuthGroupRepository.insertUserGroup(groupUuid, User.getUuid(userToAdd), t)
    const group = await AuthGroupRepository.fetchGroupByUuid(groupUuid, t)

    if (!AuthGroup.isSystemAdminGroup(group)) {
      await ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.userInvite,
        {
          [ActivityLog.keysContent.uuid]: User.getUuid(userToAdd),
          [ActivityLog.keysContent.groupUuid]: groupUuid,
        },
        false,
        t,
      )
    }
  })

// ==== READ

const _assocUserAuthGroups = async user =>
  User.assocAuthGroups(await AuthGroupRepository.fetchUserGroups(User.getUuid(user)))(user)

const _userFetcher = fetchFn => async (...args) => {
  const user = await fetchFn(...args)
  return user ? await _assocUserAuthGroups(user) : null
}

export const countUsersBySurveyId = UserRepository.countUsersBySurveyId

export const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

export const fetchUserByUuid = _userFetcher(UserRepository.fetchUserByUuid)

export const fetchUserProfilePicture = UserRepository.fetchUserProfilePicture

export const fetchUsersBySurveyId = async (surveyId, offset, limit, fetchSystemAdmins, client = db) =>
  await client.tx(async t => {
    const users = await UserRepository.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins, t)
    return await Promise.all(users.map(_assocUserAuthGroups))
  })

export const findUserByEmailAndPassword = async (email, password, passwordCompareFn) => {
  const user = await UserRepository.fetchUserAndPasswordByEmail(email)

  if (user && (await passwordCompareFn(password, user.password)))
    return await _assocUserAuthGroups(R.dissoc('password', user))

  return null
}

// ==== UPDATE

const _updateUser = async (user, surveyId, userUuid, name, email, groupUuid, profilePicture, client = db) =>
  await client.tx(async t => {
    const newGroup = await AuthGroupRepository.fetchGroupByUuid(groupUuid)

    if (AuthGroup.isSystemAdminGroup(newGroup)) {
      // If new group is SystemAdmin, delete all user groups and set his new group to SystemAdmin
      await AuthGroupRepository.deleteAllUserGroups(userUuid, t)
      await AuthGroupRepository.insertUserGroup(groupUuid, userUuid, t)
    } else {
      await AuthGroupRepository.updateUserGroup(surveyId, userUuid, groupUuid, t)
      // Log user update activity only for non system admin users
      await ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.userUpdate,
        { [ActivityLog.keysContent.uuid]: userUuid, name, email, groupUuid },
        false,
        t,
      )
    }

    return await UserRepository.updateUser(userUuid, name, email, profilePicture, t)
  })

export const updateUser = _userFetcher(_updateUser)

export const updateNamePasswordAndStatus = UserRepository.updateNamePasswordAndStatus

export const updateUserPrefs = async user => ({
  ...(await UserRepository.updateUserPrefs(user)),
  [User.keys.authGroups]: await AuthGroupRepository.fetchUserGroups(User.getUuid(user)),
})

export const resetUsersPrefsSurveyCycle = UserRepository.resetUsersPrefsSurveyCycle

// ==== DELETE

export const deleteUser = async (user, surveyId, userUuidToRemove, client = db) =>
  await client.tx(
    async t =>
      await Promise.all([
        AuthGroupRepository.deleteUserGroup(surveyId, userUuidToRemove, t),
        ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.userRemove,
          { [ActivityLog.keysContent.uuid]: userUuidToRemove },
          false,
          t,
        ),
      ]),
  )
