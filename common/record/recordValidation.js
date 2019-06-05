const R = require('ramda')

const Validator = require('../validation/validator')
const Node = require('./node')
const NodeDef = require('../survey/nodeDef')

const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

const keysError = {
  duplicateEntity: 'duplicateEntity',
  duplicateRecord: 'duplicateRecord'
}

const getValidationChildrenCount = (parentNode, childDef) => R.pipe(
  Validator.getFieldValidation(Node.getUuid(parentNode)),
  Validator.getFieldValidation(keys.childrenCount),
  Validator.getFieldValidation(NodeDef.getUuid(childDef))
)

const getNodeValidation = node =>
  R.pipe(
    Validator.getFieldValidation(Node.getUuid(node)),
    Validator.dissocFieldValidation(keys.childrenCount)
  )

const getMultipleNodesValidation = (parentNode, childDef) =>
  getValidationChildrenCount(parentNode, childDef)

module.exports = {
  keys,
  keysError,

  // READ
  getNodeValidation,
  getMultipleNodesValidation,

  getValidationChildrenCount,
}