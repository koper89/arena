import axios from 'axios'

import Survey from '../../core/survey/survey'

import * as SurveyState from './surveyState'

import { hideAppLoader, showAppJobMonitor, showAppLoader, showNotificationMessage } from '../app/actions'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyDelete = 'survey/delete'
export const surveyDefsLoad = 'survey/defs/load'
export const surveyDefsReset = 'survey/defs/reset'

const defs = {
  nodeDefs: 'nodeDefs',
  categories: 'categories',
  taxonomies: 'taxonomies',
}

const _fetchDefs = (surveyId, defs, params = {}) =>
  axios.get(`/api/survey/${surveyId}/${defs}`, { params })

export const initSurveyDefs = (draft = false, validate = false) => async (dispatch, getState) => {
  const state = getState()

  if (!SurveyState.areDefsFetched(draft)(state)) {
    dispatch(showAppLoader())

    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    const params = {
      draft,
      validate,
      cycle
    }

    const [
      { data: { nodeDefs, nodeDefsValidation } },
      { data: { categories } },
      { data: { taxonomies } }
    ] = await Promise.all([
      _fetchDefs(surveyId, defs.nodeDefs, params),
      _fetchDefs(surveyId, defs.categories, params),
      _fetchDefs(surveyId, defs.taxonomies, params),
    ])

    dispatch({ type: surveyDefsLoad, nodeDefs, nodeDefsValidation, categories, taxonomies, draft })
    dispatch(hideAppLoader())
  }
}

export const resetSurveyDefs = () => dispatch => dispatch({ type: surveyDefsReset })

export const reloadSurveyDefs = (draft = false, validate = false) => dispatch => {
  dispatch(resetSurveyDefs())
  dispatch(initSurveyDefs(draft, validate))
}

// ====== SET ACTIVE SURVEY
export const setActiveSurvey = (surveyId, canEdit = true, dispatchSurveyCreate = false) => async dispatch => {
  //load survey
  const params = { draft: canEdit, validate: canEdit }
  const { data: { survey } } = await axios.get(`/api/survey/${surveyId}`, { params })
  dispatch({ type: dispatchSurveyCreate ? surveyCreate : surveyUpdate, survey })
}

// ====== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.put(`/api/survey/${surveyId}/publish`)

  dispatch(
    showAppJobMonitor(data.job, () => {
      dispatch(setActiveSurvey(surveyId, true))
    })
  )
}

// ====== DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  await axios.delete(`/api/survey/${surveyId}`)

  dispatch({ type: surveyDelete, surveyInfo })
  dispatch(showNotificationMessage('homeView.surveyDeleted', { surveyName: Survey.getName(surveyInfo) }))
}

