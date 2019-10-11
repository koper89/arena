const R = require('ramda')
const fastcsv = require('fast-csv')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const DataTable = require('../schemaRdb/dataTable')

const SurveyManager = require('../../survey/manager/surveyManager')
const SurveyRdbManager = require('../manager/surveyRdbManager')
const RecordManager = require('../../record/manager/recordManager')

const exportTableToCSV = async (surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, filter, sort, output) => {
  const survey = await _fetchSurveyAndNodeDefs(surveyId, cycle)
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)

  const csvStream = fastcsv.format({ headers: true })
  csvStream.pipe(output)

  // 1. write headers
  csvStream.write(colNames)

  let offset = 0
  const limit = 500
  let complete = false

  // 2. write rows
  while (!complete) {

    const rows = await SurveyRdbManager.queryTable(surveyId, cycle, tableName, colNames, offset, limit, filter, sort)

    rows.forEach(row => {
      csvStream.write(R.values(row))
    })

    offset = offset + limit
    if (rows.length < limit)
      complete = true
  }

  // 3. close stream
  csvStream.end()
}

const _fetchSurveyAndNodeDefs = async (surveyId, cycle) => {
  const surveySummary = await SurveyManager.fetchSurveyById(surveyId, true)
  const surveyInfo = Survey.getSurveyInfo(surveySummary)
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

const queryTable = async (surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols = [],
                          offset = 0, limit = null, filterExpr = null, sort = null, editMode = false) => {
  const survey = await _fetchSurveyAndNodeDefs(surveyId, cycle)

  // 1. find ancestor defs of table def
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)

  // 2. get hierarchy entities uuid col names
  const ancestorUuidColNames = []
  Survey.visitAncestorsAndSelf(
    nodeDefTable,
    nodeDefCurrent => ancestorUuidColNames.push(`${NodeDef.getName(nodeDefCurrent)}_uuid`)
  )(survey)

  // 3. prepare cols to fetch
  const queryCols = [
    DataTable.colNameRecordUuuid,
    ...ancestorUuidColNames,
    ...NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  ]
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))

  // 4. fetch data
  let rows = await SurveyRdbManager.queryTable(surveyId, cycle, tableName, queryCols, offset, limit, filterExpr, sort)

  // 5. in edit mode, assoc nodes to columns
  if (editMode) {
    rows = await Promise.all(rows.map(
      async row => {
        const { record_uuid: recordUuid } = row

        const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

        const resultRow = {
          ...row,
          cols: {},
          record,
          parentNodeUuid: R.prop(`${NodeDef.getName(nodeDefTable)}_uuid`, row)
        }

        //assoc nodes to each columns
        for (const nodeDefUuidCol of nodeDefUuidCols) {
          const nodeDefCol = Survey.getNodeDefByUuid(nodeDefUuidCol)(survey)
          const nodeDefColParent = Survey.getNodeDefParent(nodeDefCol)(survey)
          const parentUuidColName = `${NodeDef.getName(nodeDefColParent)}_uuid`
          const parentUuid = R.prop(parentUuidColName, row)

          const node = NodeDef.isMultiple(nodeDefTable) && NodeDef.isEqual(nodeDefCol)(nodeDefTable) // column is the multiple attribute
            ? await RecordManager.fetchNodeByUuid(surveyId, row[`${NodeDef.getName(nodeDefCol)}_uuid`])
            : (await RecordManager.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, parentUuid, [nodeDefUuidCol]))[0]

          resultRow.cols[nodeDefUuidCol] = { parentUuid, node }
        }

        return resultRow
      }
    ))
  }

  return rows
}

const countTable = async (surveyId, cycle, nodeDefUuidTable, filter) => {
  const survey = await _fetchSurveyAndNodeDefs(surveyId, cycle)
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  return await SurveyRdbManager.countTable(surveyId, cycle, tableName, filter)
}

module.exports = {
  queryTable,
  countTable,
  exportTableToCSV,
}