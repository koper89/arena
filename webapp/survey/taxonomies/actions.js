import axios from 'axios'

import { getStateSurveyId } from '../surveyState'

export const taxonomiesLoad = 'survey/taxonomies/load'

export const fetchTaxonomies = (draft = false, validate = false) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies?draft=${draft}&validate=${validate}`)

  dispatch({type: taxonomiesLoad, taxonomies: data.taxonomies})
}
