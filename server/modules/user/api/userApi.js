import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as User from '@core/user/user'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'
import * as ProcessUtils from '@core/processUtils'

import SystemError from '@core/systemError'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as UserService from '../service/userService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

const _checkSelf = req => {
  const { userUuid } = Request.getParams(req)
  const user = Request.getUser(req)
  if (userUuid !== User.getUuid(user)) {
    throw new UnauthorizedError(user && User.getName(user))
  }
}

export const init = app => {
  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const { surveyId, email, groupUuid, surveyCycleKey } = Request.getParams(req)
      const validation = await UserValidator.validateInvitation(Request.getBody(req))

      if (!Validation.isValid(validation)) {
        throw new SystemError('appErrors.userInvalid')
      }

      const serverUrl = Request.getServerUrl(req)
      await UserService.inviteUser(user, surveyId, surveyCycleKey, email, groupUuid, serverUrl)
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  // ==== READ

  const _getUser = async (req, res) => {
    const { userUuid } = Request.getParams(req)
    const user = await UserService.fetchUserByUuid(userUuid)
    res.json(user)
  }

  app.get('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserViewPermission, async (req, res, next) => {
    try {
      await _getUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.get('/user/:userUuid', async (req, res, next) => {
    try {
      _checkSelf(req)
      await _getUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/users/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)

      const count = await UserService.countUsersBySurveyId(user, surveyId)
      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/users', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, offset, limit } = Request.getParams(req)

      const list = await UserService.fetchUsersBySurveyId(user, surveyId, offset, limit)

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/user/:userUuid/profilePicture', async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)

      const profilePicture = await UserService.fetchUserProfilePicture(userUuid)

      // Ensure we don't need to make duplicate requests by caching the profile picture for a small instant.
      // The value of 3 seconds is chosen as the smallest amount of time it takes for a user to switch to
      // a new profile picture, ensuring they always see their own newest picture.
      res.set('Cache-Control', 'private, max-age=3')

      if (profilePicture) {
        res.end(profilePicture, 'binary')
      } else {
        res.sendFile(`${__dirname}/avatar.png`, {
          root: ProcessUtils.ENV.arenaRoot,
        })
      }
    } catch (error) {
      next(error)
    }
  })

  // ==== UPDATE

  app.put('/user/accept-invitation', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { name, password } = Request.getParams(req)

      await UserService.acceptInvitation(user, name, password)

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  const _updateUser = async (req, res) => {
    const validation = await UserValidator.validateUser(Request.getBody(req))

    if (!Validation.isValid(validation)) {
      throw new SystemError('appErrors.userInvalid')
    }

    const user = Request.getUser(req)
    const { surveyId, userUuid, name, email, groupUuid } = Request.getParams(req)

    const fileReq = Request.getFile(req)

    const updatedUser = await UserService.updateUser(user, surveyId, userUuid, name, email, groupUuid, fileReq)

    res.json(updatedUser)
  }

  app.put('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserEditPermission, async (req, res, next) => {
    try {
      await _updateUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.put('/user/:userUuid', async (req, res, next) => {
    try {
      _checkSelf(req)
      await _updateUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/user/:userUuid/prefs', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userToUpdate = Request.getBody(req)

      if (!User.isEqual(userToUpdate)(user)) {
        throw new SystemError('userNotAllowedToChangePref')
      }

      await UserService.updateUserPrefs(userToUpdate)

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserRemovePermission, async (req, res, next) => {
    try {
      const { surveyId, userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUser(user, surveyId, userUuid)

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
