const R = require('ramda')

const ObjectUtils = require('../../core/objectUtils')

const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  processingStepUuid: 'processingStepUuid',
  props: ObjectUtils.keys.props,
}

const keysProps = {
  formula: 'formula',
  aggregateFn: 'aggregateFn',
}

const aggregateFn = {
  avg: 'avg',
  count: 'count',
  max: 'max',
  min: 'min',
  sum: 'sum',
}
// ====== READ

const getAggregateFunction = ObjectUtils.getProp(keysProps.aggregateFn, aggregateFn.sum)
const getFormula = ObjectUtils.getProp(keysProps.formula)
const getNodeDefUuid = ObjectUtils.getNodeDefUuid

module.exports = {
  keys,
  keysProps,

  //READ
  getAggregateFunction,
  getFormula,
  getIndex: ObjectUtils.getIndex,
  getNodeDefUuid,
  getUuid: ObjectUtils.getUuid,
}