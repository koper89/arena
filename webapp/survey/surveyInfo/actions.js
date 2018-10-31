import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'
import { getStateSurveyId } from '../surveyState'

export const surveyInfoPropUpdate = 'survey/info/prop/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProp = (key, value) => async (dispatch) => {
  dispatch({type: surveyInfoPropUpdate, key, value})

  dispatch(_updateProp(key, value))
}

const _updateProp = (key, value) => {

  const action = async (dispatch, getState) => {

    const surveyId = getStateSurveyId(getState())
    const res = await axios.put(`/api/survey/${surveyId}/prop`, {key, value})

    const {validation} = res.data
    dispatch({type: surveyInfoValidationUpdate, validation})
  }

  return debounceAction(action, `${surveyInfoPropUpdate}_${key}`)
}