import * as R from 'ramda'

const survey = 'survey'
/**
 * ======================
 * Survey State
 * ======================
 */
export const getSurveyState = R.prop(survey)

// READ
export const getCurrentSurvey = R.path(['app', survey])

export const getCurrentSurveyId = R.pipe(
  getCurrentSurvey,
  R.prop('id'),
)

export const getNewSurvey = R.pipe(
  R.path([survey, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

/**
 * ======================
 * nodeDefs State TODO: Move to common/survey/NodeDef
 * ======================
 */

// ==== READ
const nodeDefs = 'nodeDefs'

export const getNodeDefs = R.pipe(
  R.prop(nodeDefs),
  R.defaultTo({}),
)

export const getNodeDef = uuid => R.pipe(
  getNodeDefs,
  R.prop(uuid),
)

export const getNodeDefsArray = R.pipe(
  getNodeDefs,
  R.values,
)

export const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefsArray,
  R.filter(entityDef => entityDef.parentId === parentId),
)

export const getRootNodeDef = R.pipe(
  getNodeDefsByParentId(null),
  R.head,
)

export const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

// ==== UPDATE
export const assocNodeDefs = newNodeDefsArray =>
  survey => R.pipe(
    R.reduce((newNodeDefs, nodeDef) => R.assoc(nodeDef.uuid, nodeDef, newNodeDefs), {}),
    R.mergeDeepRight(getNodeDefs(survey)),
    newNodeDefs => R.assoc(nodeDefs, newNodeDefs, survey)
  )(newNodeDefsArray)

export const assocNodeDef = nodeDef =>
  R.assocPath([nodeDefs, nodeDef.uuid], nodeDef)

export const assocNodeDefProp = (nodeDefUUID, key, value) =>
  R.assocPath([nodeDefs, nodeDefUUID, 'props', key], value)

// ==== UTILITY
export const isNodeDefRoot = R.pipe(R.prop('parentId'), R.isNil)

/**
 * ======================
 * Survey-Form State
 * ======================
 */
// CURRENT VIEW NODE_DEF PAGE
const nodeDefViewPage = ['form', 'nodeDefViewPage']
export const assocFormNodeDefViewPage = nodeDef =>
  R.assocPath(nodeDefViewPage, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefViewPage = state => {
  const surveyState = getSurveyState(state)
  const uuid = R.path(nodeDefViewPage, surveyState)
  return getNodeDef(uuid)(surveyState)
}

// CURRENT EDITING NODE_DEF
const nodeDefEditPath = ['form', 'nodeDefEdit']
export const assocFormNodeDefEdit = nodeDef =>
  R.assocPath(nodeDefEditPath, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefEdit = state => {
  const surveyState = getSurveyState(state)
  const uuid = R.path(nodeDefEditPath, surveyState)
  return getNodeDef(uuid)(surveyState)
}

// CURRENT UNLOCKED NODE_DEF ENTITY
const nodeDefEntityUnlockedPath = ['form', 'nodeDefUnlocked']
export const assocNodeDefFormUnlocked = nodeDef =>
  R.assocPath(nodeDefEntityUnlockedPath, nodeDef ? nodeDef.uuid : null)

export const getNodeDefFormUnlocked = state => {
  const surveyState = getSurveyState(state)
  const uuid = R.path(nodeDefEntityUnlockedPath, surveyState)
  return getNodeDef(uuid)(surveyState)
}

export const isNodeDefFormLocked = nodeDef => R.pipe(
  getSurveyState,
  R.path(nodeDefEntityUnlockedPath),
  R.equals(nodeDef.uuid),
  R.not,
)
