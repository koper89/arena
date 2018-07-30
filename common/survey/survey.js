const R = require('ramda')

const NEW = 'new'
const DRAFT = 'draft'
const PUBLISHED = 'published'
const PUBLISHED_DRAFT = 'publishedDraft'

const surveyStatus = {

  // a survey has been created or updated
  // surveyDefn : can add and delete nodes
  // dataEntry : cannot add
  draft: DRAFT,

  // an existing survey does now allow further changes of properties of existing nodes
  // surveyDefn: can edit and will create a draft version
  // dataEntry: can add, edit, delete..
  published: PUBLISHED,

  // a publishedDraft survey diffs from the published version by the no of nodes
  // (at least 1 node was added or deleted)
  // surveyDefn: permissions same as published
  // dataEntry: can add, edit, delete..
  // BUT using survey definition of latest published version
  publishedDraft: PUBLISHED_DRAFT,

  isNew: R.equals(NEW),

  isPublished: R.equals(PUBLISHED),
}

const defaultSurvey = {
  id: -1,
  status: surveyStatus.new,
  // status: surveyStatus.draft,
}

const leftTrim = R.replace(/^\s+/, '')

const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

module.exports = {
  defaultSurvey,
  surveyStatus,
  leftTrim,
  normalizeName,
}