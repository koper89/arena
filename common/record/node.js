const R = require('ramda')

const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

/**
 * ======
 * CREATE
 * ======
 */

const newNode = (nodeDefUuid, recordId, parentUuid = null, placeholder = false, value = null) => {
  return {
    uuid: uuidv4(),
    nodeDefUuid,
    recordId,
    parentUuid,
    placeholder,
    value,
  }
}

const newNodePlaceholder = (nodeDef, parentNode, value = null) =>
  newNode(nodeDef.uuid, parentNode.recordId, parentNode.uuid, true, value)

/**
 * ======
 * READ
 * ======
 */

const getNodeValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, 'value', node)

const getNodeValueProp = (prop, defaultValue = null) => R.pipe(
  getNodeValue,
  R.propOr(defaultValue, prop),
)

/**
 * ======
 * UPDATE
 * ======
 */

/**
 * ======
 * UTILS
 * ======
 */
const isNodeValueBlank = value => {

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return isBlank(value)

  return false
}

const isNodeValueNotBlank = R.pipe(isNodeValueBlank, R.not)

module.exports = {
  // ==== CREATE
  newNode,
  newNodePlaceholder,

  // ==== READ
  getNodeValue,
  getParentUuid: R.prop('parentUuid'),
  getNodeDefUuid: R.prop('nodeDefUuid'),
  getNodeRecordId: R.prop('recordId'),
  getNodeFileName: getNodeValueProp('fileName', ''),
  getNodeItemUuid: getNodeValueProp('itemUuid'),
  getNodeTaxonUuid: getNodeValueProp('taxonUuid'),
  getNodeVernacularNameUuid: getNodeValueProp('vernacularNameUuid'),

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,
}