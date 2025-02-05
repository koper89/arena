import './nodeDefs.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyState from '@webapp/survey/surveyState'
import { setNodeDefProp, putNodeDefLayoutProp } from '@webapp/survey/nodeDefs/actions'
import * as RecordState from '../../record/recordState'

import { createNodePlaceholder, updateNode, removeNode } from '../../record/actions'
import * as NodeDefUiProps from './nodeDefUIProps'

// Edit actions
// Entry actions
import NodeDefEditButtons from './components/nodeDefEditButtons'
import NodeDefTableCellBody from './components/nodeDefTableCellBody'
import NodeDefTableCellHeader from './components/nodeDefTableCellHeader'
import NodeDefFormItem from './components/nodeDefFormItem'

class NodeDefSwitch extends React.Component {
  constructor(props) {
    super(props)

    this.element = React.createRef()
  }

  checkNodePlaceholder() {
    const { nodes, nodeDef, parentNode, createNodePlaceholder, canAddNode } = this.props

    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, NodeDefUiProps.getDefaultValue(nodeDef))
    }
  }

  componentDidMount() {
    const { nodeDef, edit } = this.props

    if (edit && !nodeDef.id) {
      this.element.current.scrollIntoView()
    }

    this.checkNodePlaceholder()
  }

  componentDidUpdate() {
    this.checkNodePlaceholder()
  }

  render() {
    const { surveyCycleKey, nodeDef, label, edit, canEditDef, renderType, applicable } = this.props

    const className =
      'survey-form__node-def-page' +
      (NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item') +
      (applicable ? '' : ' not-applicable')

    return (
      <div className={className} ref={this.element}>
        <NodeDefEditButtons surveyCycleKey={surveyCycleKey} nodeDef={nodeDef} edit={edit} canEditDef={canEditDef} />

        {renderType === NodeDefLayout.renderType.tableHeader ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={label} />
        ) : renderType === NodeDefLayout.renderType.tableBody ? (
          <NodeDefTableCellBody {...this.props} label={label} />
        ) : (
          <NodeDefFormItem {...this.props} label={label} />
        )}
      </div>
    )
  }
}

NodeDefSwitch.defaultProps = {
  // Specified when can edit node definition
  canEditDef: false,
  valid: true,

  // Entry default props
  nodes: [],
  canAddNode: false,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, entry, canEditRecord } = props

  const surveyInfo = SurveyState.getSurveyInfo(state)
  const record = RecordState.getRecord(state)
  const label = SurveyState.getNodeDefLabel(nodeDef)(state)

  const mapEntryProps = () => {
    const nodes = NodeDef.isRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : parentNode
      ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
      : []

    const nodesValidated = R.pipe(
      R.map(n =>
        Validation.assocValidation(
          R.pipe(Validation.getValidation, Validation.getFieldValidation(Node.getUuid(n)))(record),
        )(n),
      ),
    )(nodes)

    const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)

    const canAddNode =
      canEditRecord &&
      parentNode &&
      NodeDef.isMultiple(nodeDef) &&
      (R.isEmpty(maxCount) || R.length(nodes) < Number(maxCount))

    return {
      nodes: nodesValidated,
      canAddNode,
      readOnly: NodeDef.isReadOnly(nodeDef),
    }
  }

  return {
    surveyInfo,
    label,
    applicable: parentNode ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode) : true,
    ...(entry ? mapEntryProps() : {}),
  }
}

export default connect(mapStateToProps, {
  setNodeDefProp,
  putNodeDefLayoutProp,
  updateNode,
  removeNode,
  createNodePlaceholder,
})(NodeDefSwitch)
