import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
  assocNodeDefValidation,
  assocNodeDefPropValidation,
  assocNodeDefFormUnlocked,
  assocFormNodeDefViewPage,
} from './surveyState'

/**
 * survey actions
 */
import {
  surveyCurrentUpdate,
  surveyNewUpdate,
} from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefValidationUpdate,
  nodeDefPropValidationUpdate,

  //survey-form
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formNodeDefViewPage,
} from './nodeDef/actions'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //on app current survey update, reset survey state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, validation}) => assocNodeDefValidation(nodeDefUUID, validation)(state),

  [nodeDefPropValidationUpdate]: (state, {nodeDefUUID, key, validation}) => assocNodeDefPropValidation(nodeDefUUID, key, validation)(state),

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formNodeDefViewPage]: (state, {nodeDef}) => assocFormNodeDefViewPage(nodeDef)(state),
}

export default exportReducer(actionHandlers)