const R = require('ramda')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const Node = require('../../../../core/record/node')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')
const DataCol = require('../schemaRdb/dataCol')

const types = { insert: 'insert', update: 'update', delete: 'delete' }

// ==== parsing

const hasTable = NodeDef.isEntityOrMultiple

const getType = (nodeDef, node) => {
  const created = Node.isCreated(node)
  const updated = Node.isUpdated(node)
  const deleted = Node.isDeleted(node)

  return created && hasTable(nodeDef)
    ? types.insert
    : updated || created
      ? types.update
      : deleted && hasTable(nodeDef)
        ? types.delete
        : deleted
          ? types.update
          : null
}

const getColNames = (nodeDef, type) =>
  type === types.insert
    ? [
      DataTable.colNameUuuid,
      DataTable.colNameRecordUuuid,
      DataTable.colNameRecordCycle,
      DataTable.colNameParentUuuid,
      ...NodeDef.isMultipleAttribute(nodeDef)
        ? DataCol.getNames(nodeDef)
        //entity
        : []
    ]
    : DataCol.getNames(nodeDef)

const getColValues = async (survey, cycle, nodeDef, node, type, client) =>
  type === types.insert
    ? [
      Node.getUuid(node),
      Node.getRecordUuid(node),
      cycle,
      Node.getParentUuid(node),
      ...NodeDef.isMultipleAttribute(nodeDef)
        ? await Promise.all(DataCol.getValues(survey, nodeDef, node, client))
        //entity
        : []
    ]
    : await DataCol.getValues(survey, nodeDef, node, client)

const getRowUuid = (nodeDef, node, nodeParent) =>
  hasTable(nodeDef)
    ? Node.getUuid(node)
    : Node.getUuid(nodeParent)

const toUpdates = async (survey, cycle, nodeDefs, nodes, client) => {
  const updates = await Promise.all(
    R.values(nodes).map(async node => {
      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getParentUuid(nodeDef)]
      const type = getType(nodeDef, node)

      return type ? {
          type,
          schemaName: SchemaRdb.getName(Survey.getId(survey)),
          tableName: DataTable.getName(nodeDef, nodeDefParent),
          colNames: getColNames(nodeDef, type),
          colValues: await getColValues(survey, cycle, nodeDef, node, type, client),
          rowUuid: getRowUuid(nodeDef, node, nodes[Node.getParentUuid(node)])
        }
        : null
    })
  )
  return R.reject(R.isNil, updates)
}

// ==== execution

const isType = type => R.propEq('type', type)

const runUpdate = (update, client) =>
  client.query(
    `UPDATE ${update.schemaName}.${update.tableName}
      SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1`,
    [update.rowUuid, ...update.colValues]
  )

const runInsert = (update, client) =>
  client.query(
    `INSERT INTO ${update.schemaName}.${update.tableName}
      (${update.colNames.join(',')})
      VALUES 
      (${update.colNames.map((col, i) => `$${i + 1}`).join(',')})`,
    update.colValues
  )

const runDelete = (update, client) =>
  client.query(
    `DELETE FROM ${update.schemaName}.${update.tableName} WHERE uuid = $1`,
    update.rowUuid
  )

const run = async (survey, cycle, nodeDefs, nodes, client) => {
  const updates = await toUpdates(survey, cycle, nodeDefs, nodes, client)
  await client.batch(
    updates.map(update =>
      isType(types.update)(update)
        ? runUpdate(update, client)
        : isType(types.insert)(update) ? runInsert(update, client)
        : runDelete(update, client)
    )
  )
}

module.exports = {
  run,
}