const R = require('ramda')

const Survey = require('../../../../../core/survey/survey')
const NodeDef = require('../../../../../core/survey/nodeDef')

const Record = require('../../../../../core/record/record')
const RecordValidator = require('../../../../../core/record/recordValidator')
const Node = require('../../../../../core/record/node')
const Validation = require('../../../../../core/validation/validation')

const RecordRepository = require('../../repository/recordRepository')

const RecordUniquenessValidator = require('./recordUniquenessValidator')

const validateNodesAndPersistValidation = async (survey, record, nodes, validateRecordKeysUniqueness, tx) => {

  // 1. validate nodes
  const nodesValidation = await RecordValidator.validateNodes(survey, record, nodes)

  // 2. validate record keys uniqueness
  const recordKeysValidation =
    validateRecordKeysUniqueness && !Record.isPreview(record) && isRootNodeKeysUpdated(survey, nodes)
      ? await RecordUniquenessValidator.validateRecordKeysUniqueness(survey, record, tx)
      : {}

  // 3. merge validations
  const validation = Validation.recalculateValidity(
    Validation.newInstance(
      true,
      R.mergeDeepLeft(
        recordKeysValidation,
        Validation.getFieldValidations(nodesValidation)
      )
    )
  )

  // 4. persist validation
  await persistValidation(survey, record, validation, tx)

  return validation
}

const isRootNodeKeysUpdated = (survey, nodes) => R.pipe(
  R.values,
  R.any(n => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isKey(nodeDef) && NodeDef.isRoot(parentDef)
    },
  )
)(nodes)

const persistValidation = async (survey, record, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)

  const recordValidationUpdated = R.pipe(
    Record.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts,
  )(record)

  await RecordRepository.updateValidation(surveyId, Record.getUuid(record), recordValidationUpdated, tx)
}

const validateRecordsUniquenessAndPersistValidation = async (survey, record, excludeRecordFromCount, t) => {
  const recordKeyNodes = Record.getEntityKeyNodes(survey, Record.getRootNode(record))(record)

  const validationByRecord = await RecordUniquenessValidator.validateRecordsUniqueness(survey, Record.getCycle(record), recordKeyNodes, Record.getUuid(record), excludeRecordFromCount, t)

  for (const [recordUuid, nodesKeyValidation] of Object.entries(validationByRecord)) {
    const recordToUpdate = await RecordRepository.fetchRecordByUuid(Survey.getId(survey), recordUuid, t)

    await persistValidation(survey, recordToUpdate, nodesKeyValidation, t)
  }
}

module.exports = {
  persistValidation,
  updateRecordValidationsFromValues: RecordRepository.updateRecordValidationsFromValues,
  validateNodesAndPersistValidation,
  validateRecordKeysUniqueness: RecordUniquenessValidator.validateRecordKeysUniqueness,
  validateRecordsUniquenessAndPersistValidation,
}