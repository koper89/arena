const R = require('ramda')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const Record = require('../../../../core/record/record')
const Node = require('../../../../core/record/node')

const SurveyManager = require('../manager/surveyManager')
const RecordManager = require('../../record/manager/recordManager')

const Job = require('../../../job/job')

class RecordCheckJob extends Job {

  constructor (params) {
    super(RecordCheckJob.type, params)

    this.surveyAndNodeDefsByCycle = {} //cache of surveys and updated node defs by cycle
  }

  async execute (tx) {
    const recordsUuidAndCycle = await RecordManager.fetchRecordsUuidAndCycle(this.surveyId, this.tx)

    this.total = R.length(recordsUuidAndCycle)

    for (const { uuid: recordUuid, cycle } of recordsUuidAndCycle) {
      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      await this._checkRecord(surveyAndNodeDefs, recordUuid)

      this.incrementProcessedItems()
    }
  }

  async _getOrFetchSurveyAndNodeDefsByCycle (cycle) {
    let surveyAndNodeDefs = this.surveyAndNodeDefsByCycle[cycle]
    if (!surveyAndNodeDefs) {
      // 1. fetch survey
      const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, cycle, true, true, false, true, this.tx)

      // 2. determine new, updated or deleted node defs
      const nodeDefAddedUuids = []
      const nodeDefUpdatedUuids = []
      const nodeDefDeletedUuids = []

      Survey.getNodeDefsArray(survey).forEach(def => {
        const nodeDefUuid = NodeDef.getUuid(def)
        if (NodeDef.isDeleted(def)) {
          nodeDefDeletedUuids.push(nodeDefUuid)
        } else if (!NodeDef.isPublished(def)) {
          // new node def
          nodeDefAddedUuids.push(nodeDefUuid)
        } else if (NodeDef.hasAdvancedPropsDraft(def)) {
          // already existing node def but validations have been updated
          nodeDefUpdatedUuids.push(nodeDefUuid)
        }
      })

      surveyAndNodeDefs = {
        survey,
        nodeDefAddedUuids,
        nodeDefUpdatedUuids,
        nodeDefDeletedUuids,
      }
      this.surveyAndNodeDefsByCycle[cycle] = surveyAndNodeDefs
    }
    return surveyAndNodeDefs
  }

  async _checkRecord (surveyAndNodeDefs, recordUuid) {
    const { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids } = surveyAndNodeDefs

    if (R.all(R.isEmpty)([nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids]))
      return //nothing to update

    // 1. fetch record and nodes
    let record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, true, this.tx)

    // 2. remove deleted nodes
    if (!R.isEmpty(nodeDefDeletedUuids)) {
      const recordDeletedNodes = await RecordManager.deleteNodesByNodeDefUuids(this.surveyId, nodeDefDeletedUuids, record, this.tx)
      record = recordDeletedNodes || record
    }

    // 3. insert missing nodes
    const { record: recordUpdateInsert, nodes: missingNodes = {} } = await _insertMissingSingleNodes(survey, nodeDefAddedUuids, record, this.user, this.tx)
    record = recordUpdateInsert || record

    // 4. apply default values and recalculate applicability
    const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(survey, nodeDefUpdatedUuids, record, missingNodes, this.tx)
    record = recordUpdate || record

    // 5. validate nodes
    const nodesToValidate = {
      ...missingNodes,
      ...nodesUpdatedDefaultValues
    }

    await _validateNodes(survey, R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids), record, nodesToValidate, this.tx)
  }
}

/**
 * Inserts a missing single node in a specified parent node.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const _insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  if (NodeDef.isSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)
      return await RecordManager.insertNode(survey, record, childNode, user, tx)
    }
  }
  return {}
}

/**
 * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const _insertMissingSingleNodes = async (survey, nodeDefAddedUuids, record, user, tx) => {
  const nodesAdded = {}
  for (const nodeDefUuid of nodeDefAddedUuids) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(record)
    for (const parentNode of parentNodes) {
      Object.assign(nodesAdded, await _insertMissingSingleNode(survey, nodeDef, record, parentNode, user, tx))
    }
  }
  return nodesAdded
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefUpdatedUuids, record, newNodes, tx) => {
  const nodesToUpdate = {
    ...newNodes
  }

  // include nodes associated to updated node defs
  for (const nodeDefUpdatedUuid of nodeDefUpdatedUuids) {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(nodeDefUpdatedUuid)(record)
    for (const nodeUpdated of nodesToUpdatePartial) {
      nodesToUpdate[Node.getUuid(nodeUpdated)] = nodeUpdated
    }
  }

  return await RecordManager.updateNodesDependents(survey, record, nodesToUpdate, tx)
}

const _validateNodes = async (survey, nodeDefAddedUpdatedUuids, record, nodes, tx) => {
  const nodesToValidate = {
    ...nodes
  }

  // include parent nodes of new/updated node defs (needed for min/max count validation)
  for (const nodeDefUuid of nodeDefAddedUpdatedUuids) {
    const def = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    for (const parentNode of parentNodes) {
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    }
  }

  // record keys uniqueness must be validated after RDB generation
  await RecordManager.validateNodesAndPersistValidation(survey, record, nodesToValidate, false, tx)
}

RecordCheckJob.type = 'RecordCheckJob'

module.exports = RecordCheckJob
