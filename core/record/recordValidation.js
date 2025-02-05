import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Node from './node'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
}

export const prefixValidationFieldChildrenCount = 'childrenCount_'

// ===== UTILS
export const getValidationChildrenCountKey = (nodeParentUuid, nodeDefChildUuid) =>
  `${prefixValidationFieldChildrenCount}${nodeParentUuid}_${nodeDefChildUuid}`
export const isValidationFieldKeyChildrenCount = R.startsWith(prefixValidationFieldChildrenCount)
export const isValidationResultErrorCount = validationResult =>
  R.includes(ValidationResult.getKey(validationResult), [
    Validation.messageKeys.record.nodesMinCountNotReached,
    Validation.messageKeys.record.nodesMaxCountExceeded,
  ])
export const getValidationCountNodeDefUuid = field => R.pipe(R.split('_'), R.last)(field)

// ===== CREATE
export const newValidationRecordDuplicate = (isUnique = false) =>
  Validation.newInstance(isUnique, {
    [keys.recordKeys]: Validation.newInstance(
      isUnique,
      {},
      isUnique ? [] : [{ key: Validation.messageKeys.record.keyDuplicate }],
    ),
  })

// ===== READ

export const getValidationChildrenCount = (nodeParentUuid, nodeDefChildUuid) =>
  Validation.getFieldValidation(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid))

export const getNodeValidation = node => Validation.getFieldValidation(Node.getUuid(node))

// ===== UPDATE
export const setValidationCount = (nodeParentUuid, nodeDefChildUuid, validationCount) =>
  Validation.setField(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid), validationCount)
