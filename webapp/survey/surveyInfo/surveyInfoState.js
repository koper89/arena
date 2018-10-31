import * as R from 'ramda'

/**
 * ======
 * UPDATE
 * ======
 */

export const markPublished = R.pipe(
  R.assoc('published', true),
  R.assoc('draft', false),
)

export const markDraft = R.assoc('draft', true)

export const assocSurveyInfoProp = (key, value) => R.pipe(
  R.assocPath(['props', key], value),
  // reset validation
  R.dissocPath(['validation', 'fields', key]),
  //set as draft
  markDraft,
)

export const assocSurveyInfoValidation = (validation) => R.assoc('validation', validation)