import { combineReducers } from 'redux'

import * as CategoryState from './category/categoryState'
import * as NodeDefState from './nodeDef/nodeDefState'
import * as RecordState from './record/recordState'
import * as SurveyFormState from './surveyForm/surveyFormState'
import * as TaxonomyState from './taxonomy/taxonomyState'

import category from './category/reducer'
import nodeDefEdit from './nodeDef/reducer'
import record from './record/reducer'
import surveyForm from './surveyForm/reducer'
import taxonomyEdit from './taxonomy/reducer'

export default combineReducers({
  [CategoryState.stateKey]: category,
  [NodeDefState.stateKey]: nodeDefEdit,
  [RecordState.stateKey]: record,
  [SurveyFormState.stateKey]: surveyForm,
  [TaxonomyState.stateKey]: taxonomyEdit,
})
