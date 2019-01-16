const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Node = require('../../../../../common/record/node')

const NodeRepository = require('../../../nodeRepository')

const fetchDependentNodes = async (survey, node, dependencyType, tx) => {
  const surveyId = Survey.getId(survey)

  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const dependentUuids = Survey.getNodeDefDependencies(nodeDefUuid, dependencyType)(survey)

  if (dependentUuids) {
    const dependentDefs = Survey.getNodeDefsByUuids(dependentUuids)(survey)

    const dependentsPerDef = await Promise.all(
      dependentDefs.map(async dependentDef => {
        //1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
          R.last
        )(NodeDef.getMetaHierarchy(dependentDef))

        //2 find common parent node
        const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, Node.getUuid(node), commonParentDefUuid, tx)

        //3 find descendent nodes of common parent node with nodeDefUuid = dependentDef uuid
        return await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getUuid(commonParentNode), NodeDef.getUuid(dependentDef), tx)
      })
    )
    return R.pipe(
      R.flatten,
      R.uniq,
    )(dependentsPerDef)
  } else {
    return []
  }
}

const persistDependentNodeValue = async (survey, node, value, isDefaultValue, tx) => {
  const oldValue = Node.getNodeValue(node, null)

  return R.equals(oldValue, value)
    ? {}
    : {
      [Node.getUuid(node)]: await NodeRepository.updateNode(
        Survey.getId(survey),
        Node.getUuid(node),
        value,
        {[Node.metaKeys.defaultValue]: isDefaultValue},
        tx
      )
    }
}

const persistDependentNodeApplicable = async (survey, node, applicable, tx) => {
  const surveyId = Survey.getId(survey)
  const parentUuid = Node.getParentUuid(node)
  const parentNode = await NodeRepository.fetchNodeByUuid(surveyId, parentUuid, tx)

  const nodeDefUuid = Node.getNodeDefUuid(node)
  const applicableOld = Node.isChildApplicable(nodeDefUuid)(parentNode)

  if (applicable !== applicableOld) {
    return {
      [parentUuid]: await NodeRepository.updateChildrenApplicability(
        surveyId,
        parentUuid,
        nodeDefUuid,
        applicable,
        tx
      )
    }
  } else {
    return {}
  }
}

module.exports = {
  //READ
  fetchDependentNodes,

  //UPDATE
  persistDependentNodeValue,
  persistDependentNodeApplicable,
}