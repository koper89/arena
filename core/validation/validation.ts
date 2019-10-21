const R = require('ramda')

const ValidatorErrorKeys = require('./_validator/validatorErrorKeys')
const ObjectUtils = require('../objectUtils')

// const objectInvalid = {
//   [keys.valid]: false,
//   [keys.errors]: [{ key: 'error_key', params }],
//   [keys.warnings]: [{ key: 'error_key', params }],
//   [keys.fields]: {
//      'aaa': {
//        [keys.valid]: false,
//        [keys.errors]: [{ key: 'error_key', params }],
//        [keys.warnings]: [{ key: 'error_key', params }],
//        [keys.fields]: {
//          'bbb': {
//            [keys.valid]: false,
//            [keys.errors]: [{ key: 'error_key', params }],
//            [keys.warnings]: [{ key: 'error_key', params }],
//        }
//     }
//   },
// }

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
  warnings: 'warnings',
  counts: 'counts',

  validation: 'validation',
}

//====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = validation => {
  //cleanup fields
  let allFieldsValid = true
  const fieldsCleaned = Object.entries(getFieldValidations(validation)).reduce(
    (fieldsAcc, [field, fieldValidation]) => {
      const fieldValidationCleaned = cleanup(fieldValidation)
      if (!isValid(fieldValidationCleaned)) {
        allFieldsValid = false
        fieldsAcc[field] = fieldValidationCleaned
      }
      return fieldsAcc
    },
    {},
  )

  return newInstance(
    allFieldsValid && !hasErrors(validation) && !hasWarnings(validation),
    fieldsCleaned,
    getErrors(validation),
    getWarnings(validation)
  )
}

const recalculateValidity = validation => R.pipe(
  getFieldValidations,
  // update validity in each field
  R.map(recalculateValidity),
  fields => {
    const errors = getErrors(validation)
    const warnings = getWarnings(validation)
    const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors) && R.isEmpty(warnings)
    return newInstance(valid, fields, errors, warnings)
  }
)(validation)

const updateCounts = validation => {
  let totalErrors = 0
  let totalWarnings = 0

  const stack = []
  stack.push(validation)

  while (!R.isEmpty(stack)) {
    const validationCurrent = stack.pop()

    // update total errors
    totalErrors += R.pipe(
      getErrors,
      R.length
    )(validationCurrent)

    // update total warnings
    totalWarnings += R.pipe(
      getWarnings,
      R.length
    )(validationCurrent)

    // add field validations to stack
    const validationFields = getFieldValidations(validationCurrent)
    if (!R.isEmpty(validationFields))
      stack.push(...R.values(validationFields))
  }

  return {
    ...validation,
    [keys.counts]: {
      [keys.errors]: totalErrors,
      [keys.warnings]: totalWarnings,
    }
  }
}

//====== CREATE

const newInstance = (valid = true, fields = {}, errors = [], warnings = []) => ({
  [keys.valid]: valid,
  [keys.fields]: fields,
  [keys.errors]: errors,
  [keys.warnings]: warnings,
})

//====== READ

const isValid = R.propOr(true, keys.valid)
const getFieldValidations = R.propOr({}, keys.fields)
const getFieldValidation = field => R.pathOr(newInstance(), [keys.fields, field])

const getErrors = R.propOr([], keys.errors)
const hasErrors = R.pipe(getErrors, R.isEmpty, R.not)
const getWarnings = R.propOr([], keys.warnings)
const hasWarnings = R.pipe(getWarnings, R.isEmpty, R.not)
const hasWarningsInFields = R.pipe(getFieldValidations, R.values, R.any(hasWarnings))
const isWarning = validation => hasWarnings(validation) || hasWarningsInFields(validation)
const getCounts = R.propOr({}, keys.counts)
const getErrorsCount = R.pipe(getCounts, R.propOr(0, keys.errors))
const getWarningsCount = R.pipe(getCounts, R.propOr(0, keys.warnings))

//====== UPDATE

const setValid = valid => ObjectUtils.setInPath([keys.valid], valid)
const setField = (field, fieldValidation) => ObjectUtils.setInPath([keys.fields, field], fieldValidation)
const setErrors = errors => ObjectUtils.setInPath([keys.errors], errors)

const assocFieldValidation = (field, fieldValidation) => R.pipe(
  R.assocPath([keys.fields, field], fieldValidation),
  cleanup
)

const dissocFieldValidation = field => R.pipe(
  R.dissocPath([keys.fields, field]),
  cleanup
)

const mergeValidation = validationNew => validationOld => R.pipe(
  validation => ({
    [keys.fields]: R.mergeDeepRight(
      getFieldValidations(validation),
      getFieldValidations(validationNew)
    )
  }),
  cleanup,
)(validationOld)

// Object

const getValidation = R.propOr(newInstance(), keys.validation)
const isObjValid = R.pipe(getValidation, isValid)
const assocValidation = R.assoc(keys.validation)

module.exports = {
  keys,

  messageKeys: ValidatorErrorKeys,

  newInstance,

  isValid,
  getFieldValidations,
  getFieldValidation,

  getErrors,
  hasErrors,
  getWarnings,
  hasWarnings,
  isWarning,
  getCounts,
  getErrorsCount,
  getWarningsCount,

  setValid,
  setField,
  setErrors,

  assocFieldValidation,
  dissocFieldValidation,
  mergeValidation,
  recalculateValidity,
  updateCounts,

  // Object
  getValidation,
  isObjValid,
  assocValidation,
}