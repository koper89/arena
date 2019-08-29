const R = require('ramda')

const Record = require('../../../../../common/record/record')
const RecordValidation = require('../../../../../common/record/recordValidation')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')
const ValidatorErrorKeys = require('../../../../../common/validation/validatorErrorKeys')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await SurveyRdbManager.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)
  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  const validationNodesKey = {}
  for (const keyNode of keyNodes) {
    validationNodesKey[Node.getUuid(keyNode)] = _newValidationRecordDuplicate(isUnique)
  }
  return validationNodesKey
}

/**
 * Returns an indexed object with recordUuid as key and validation as value
 */
const validateRecordsUniqueness = async (survey, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx) => {
  const result = {}
  const recordsCountRows = await SurveyRdbManager.fetchRecordsCountByKeys(survey, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx)

  if (!R.isEmpty(recordsCountRows)) {
    for (const { recordUuid, count, nodesKeyUuids } of recordsCountRows) {
      const isUnique = count === '1'
      const validationNodesKeyFields = {}
      for (const nodeKeyUuid of nodesKeyUuids) {
        validationNodesKeyFields[nodeKeyUuid] = _newValidationRecordDuplicate(isUnique)
      }
      result[recordUuid] = {
        [Validator.keys.fields]: validationNodesKeyFields
      }
    }
  }
  return result
}

const _newValidationRecordDuplicate = isUnique => ({
  [Validator.keys.fields]: {
    [RecordValidation.keys.recordKeys]: {
      [Validator.keys.errors]: isUnique ? [] : [{ key: ValidatorErrorKeys.record.keyDuplicate }],
      [Validator.keys.valid]: isUnique
    }
  }
})

module.exports = {
  validateRecordKeysUniqueness,
  validateRecordsUniqueness
}