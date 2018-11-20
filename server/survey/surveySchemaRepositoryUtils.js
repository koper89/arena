const db = require('../db/db')

const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')

const getSurveyDBSchema = surveyId => `survey_${surveyId}`

// ====== UPDATE

const markSurveyDraft = async (surveyId, client = db) =>
  await client.query(`
    UPDATE survey 
    SET draft = true
    WHERE id = $1
  `, [surveyId])

const publishSurveySchemaTableProps = async (surveyId, tableName, client = db) =>
  await client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb
  `)

const updateSurveySchemaTableProp = async (surveyId, tableName, recordId, key, value, client = db) =>
  await updateSurveySchemaTableProps(surveyId, tableName, recordId, {[key]: value}, client)

const updateSurveySchemaTableProps = async (surveyId, tableName, recordId, props, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE id = $2
     RETURNING *`
    , [JSON.stringify(props), recordId]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableRecord = async (surveyId, tableName, recordId, client = db) =>
  await client.one(`
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE id = $1 RETURNING *`
    , [recordId]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableProp = async (surveyId, tableName, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.${tableName} SET props = props #- '{${deletePath.join(',')}}'`)

module.exports = {
  getSurveyDBSchema,

  markSurveyDraft,
  publishSurveySchemaTableProps,

  updateSurveySchemaTableProp,
  updateSurveySchemaTableProps,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
}
