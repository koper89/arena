import { assocActionProps, exportReducer } from '../utils/reduxUtils'

import {
  appPropsChange,
  appUserLogout,
  appSavingUpdate,
} from './actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '../survey/actions'

import * as AppState from './appState'

const actionHandlers = {

  [appPropsChange]: (state, { survey, ...props }) => assocActionProps(state, props),

  // ====== user

  [appUserLogout]: (state) => AppState.logoutUser(state),

  [surveyCreate]: (state, { survey }) => AppState.assocUserPropsOnSurveyCreate(survey)(state),

  [surveyUpdate]: (state, { survey }) => AppState.assocUserPropsOnSurveyUpdate(survey)(state),

  [surveyDelete]: (state, { surveyInfo }) => AppState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),

  // ====== saving
  [appSavingUpdate]: (state, { saving }) => AppState.assocSaving(saving)(state),
}

export default exportReducer(actionHandlers)
