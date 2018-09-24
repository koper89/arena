const R = require('ramda')

const {assocCodeListLevel, assocCodeListItem} = require('./codeList')

const {
  getProps,
  getProp,
  getLabels,

  setProp,
} = require('./surveyUtils')
const {
  isNodeDefRoot,
  isNodeDefEntity,
} = require('./nodeDef')

// == utils
const nodeDefs = 'nodeDefs'

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const codeLists = 'codeLists'

/**
 * ======
 * READ
 * ======
 */
const isSurveyPublished = R.pipe(
  R.prop('published'),
  R.equals(true)
)

const isSurveyDraft = R.pipe(
  R.prop('draft'),
  R.equals(true)
)

const getSurveyLanguages = getProp('languages', [])

const getSurveyDefaultLanguage = R.pipe(
  getSurveyLanguages,
  R.head,
)

const getSurveyDefaultStep = R.pipe(
  getProp('steps'),
  R.toPairs,
  R.find(s => !s[1].prev),
  R.head
)

const getSurveyLabels = getProp('labels', {})

const getSurveyDefaultLabel = survey => {
  const labels = getSurveyLabels(survey)
  const lang = getSurveyDefaultLanguage(survey)
  return R.prop(lang, labels)
}

const getSurveyStatus = survey =>
  isSurveyPublished(survey) && isSurveyDraft(survey)
    ? 'PUBLISHED-DRAFT'
    : isSurveyPublished(survey)
    ? 'PUBLISHED'
    : isSurveyDraft(survey)
      ? 'DRAFT'
      : ''

/**
 * ======
 * READ NodeDefs
 * ======
 */
const getNodeDefs = R.pipe(R.prop(nodeDefs), R.defaultTo({}))

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefByUUID = uuid => R.pipe(getNodeDefs, R.prop(uuid))

const getNodeDefById = id => R.pipe(
  getNodeDefsArray,
  R.find(R.propEq('id', id)),
)

const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefsArray,
  R.filter(R.propEq('parentId', parentId)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentId(null), R.head)

const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

const getNodeDefsByCodeListUUID = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'codeListUUID'], uuid))
)

/**
 * ======
 * UPDATE
 * ======
 */
const assocSurveyPropValidation = (key, validation) =>
  R.assocPath(['validation', 'fields', key], validation)

/**
 * ======
 * UPDATE NodeDefs
 * ======
 */
const assocNodeDefs = newNodeDefsArray =>
  survey => R.pipe(
    R.reduce((newNodeDefs, nodeDef) => R.assoc(nodeDef.uuid, nodeDef, newNodeDefs), {}),
    R.mergeDeepRight(getNodeDefs(survey)),
    newNodeDefs => R.assoc(nodeDefs, newNodeDefs, survey)
  )(newNodeDefsArray)

const assocNodeDef = nodeDef => R.assocPath([nodeDefs, nodeDef.uuid], nodeDef)

const assocNodeDefProp = (nodeDefUUID, key, value) => R.pipe(
  R.assocPath([nodeDefs, nodeDefUUID, 'props', key], value),
  R.dissocPath([nodeDefs, nodeDefUUID, 'validation', 'fields', key]),
)

const assocNodeDefValidation = (nodeDefUUID, validation) =>
  R.assocPath([nodeDefs, nodeDefUUID, 'validation'], validation)

/**
 * ======
 * DELETE NodeDef
 * ======
 */
const dissocNodeDef = nodeDef =>
  survey => {
    const updatedSurvey = isNodeDefEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        survey,
        getNodeDefChildren(nodeDef)(survey)
      ) : survey

    return R.dissocPath([nodeDefs, nodeDef.uuid])(updatedSurvey)
  }

/**
 * ======
 * READ Code Lists
 * ======
 */
const getSurveyCodeLists = R.pipe(
  R.prop(codeLists),
  R.defaultTo({})
)

const getSurveyCodeListsArray = R.pipe(
  getSurveyCodeLists,
  R.values,
)

const getSurveyCodeListByUUID = uuid => R.pipe(
  getSurveyCodeLists,
  R.prop(uuid)
)

const getSurveyCodeListById = id => R.pipe(
  getSurveyCodeListsArray,
  R.find(list => list.id === id)
)

/**
 * ======
 * UPDATE Code Lists
 * ======
 */
const assocSurveyCodeLists = codeLists =>
  survey => R.pipe(
    R.merge(getSurveyCodeLists(survey)),
    //exclude null objects
    newCodeLists => R.reduce((acc, key) => {
      const codeList = R.prop(key, acc)
      return codeList === null ? R.dissoc(key, acc) : acc
    }, newCodeLists)(R.keys(newCodeLists)),
    newCodeLists => R.assoc('codeLists', newCodeLists, survey)
  )(codeLists)

const assocSurveyCodeList = codeList => assocSurveyCodeLists({[codeList.uuid]: codeList})

const assocSurveyCodeListLevel = (level) => survey => R.pipe(
  getSurveyCodeListById(level.codeListId),
  assocCodeListLevel(level),
  newCodeList => assocSurveyCodeLists({[newCodeList.uuid]: newCodeList})(survey)
)(survey)

const assocSurveyCodeListItem = (codeListUUID, item) => survey => R.pipe(
  getSurveyCodeListByUUID(codeListUUID),
  assocCodeListItem(item),
  updatedCodeList => assocSurveyCodeList(updatedCodeList)(survey),
)(survey)

/**
 * ======
 * UTILS NodeDefs
 * ======
 */
const getNodeDefParent = nodeDef => getNodeDefById(nodeDef.parentId)

const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (isNodeDefRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    if (nodeDefParent.id === nodeDefAncestor.id)
      return true
    else
      return isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

module.exports = {
  defaultSteps,

  // READ
  getSurveyProps: getProps,
  getSurveyLabels: getLabels,

  getSurveyName: getProp('name', ''),
  getSurveyLanguages,
  getSurveyDefaultLanguage,
  getSurveyLabels,
  getSurveyDefaultLabel,
  getSurveyDescriptions: getProp('descriptions', {}),
  getSurveySrs: getProp('srs', []),
  getSurveyDefaultStep,

  getSurveyStatus,
  isSurveyPublished,

  // READ nodeDefs
  getNodeDefByUUID,
  getRootNodeDef,
  getNodeDefChildren,
  getNodeDefsByCodeListUUID,

  // UPDATE
  assocSurveyProp: setProp,
  assocSurveyPropValidation,

  // UPDATE nodeDefs
  assocNodeDefs,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefValidation,

  // DELETE nodeDefs
  dissocNodeDef,

  //=======
  // CodeLists
  //=======
  // READ codeLists
  getSurveyCodeLists,
  getSurveyCodeListsArray,
  getSurveyCodeListByUUID,

  // UPDATE code lists
  assocSurveyCodeLists,
  assocSurveyCodeList,
  assocSurveyCodeListLevel,
  assocSurveyCodeListItem,

  // UTILS
  getSurveyDBSchema: surveyId => `survey_${surveyId}`,

  // UTILS NodeDefs
  getNodeDefParent,
  isNodeDefAncestor,
}
