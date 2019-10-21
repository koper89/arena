import './nodeDefEntityForm.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '../../../../../../commonComponents/hooks'

import { Responsive, WidthProvider } from 'react-grid-layout'

import NodeDefSwitch from '../../nodeDefSwitch'
import NodeDefErrorBadge from '../nodeDefErrorBadge'

import NodeDef from '../../../../../../../core/survey/nodeDef'
import Record from '../../../../../../../core/record/record'
import Node from '../../../../../../../core/record/node'
import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'

import { setFormPageNode, getNodeKeyLabelValues } from '../../../../surveyForm/actions'

import * as SurveyFormState from '../../../../surveyForm/surveyFormState'
import * as RecordState from '../../../../record/recordState'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityForm = props => {
  const {
    surveyInfo, surveyCycleKey, nodeDef, childDefs,
    recordUuid, node,
    edit, entry, preview,
    canEditDef, canEditRecord, canAddNode,
    locked,
    putNodeDefLayoutProp
  } = props

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
    }, 200)
  }, [])

  const onChangeLayout = (layout) => {
    if (window.innerWidth >= 480 && layout.length > 0) {
      putNodeDefLayoutProp(nodeDef, NodeDefLayout.keys.layoutChildren, layout)
    }
  }

  const columns = NodeDefLayout.getColumnsNo(surveyCycleKey)(nodeDef)
  const rdgLayout = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const innerPageChildren = NodeDefLayout.rejectNodeDefsWithPage(surveyCycleKey)(childDefs)

  return innerPageChildren.length > 0
    ? (
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={false}
        rowHeight={70}
        cols={{ lg: columns, md: columns, sm: columns, xs: columns, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout, xs: rdgLayout }}
        containerPadding={edit && canEditDef ? [15, 40] : [15, 15]}
        margin={[5, 5]}
        isDraggable={edit && canEditDef && !locked}
        isResizable={edit && canEditDef && !locked}
        compactType={null}
        useCSSTransforms={true}
        preventCollision={true}
        className={mounted ? 'mounted' : ''}
        onDragStop={onChangeLayout}
        onResizeStop={onChangeLayout}>

        {
          innerPageChildren
            .map(childDef =>
              <div key={NodeDef.getUuid(childDef)}
                   id={NodeDef.getUuid(childDef)}>
                <NodeDefSwitch
                  edit={edit}
                  entry={entry}
                  preview={preview}
                  recordUuid={recordUuid}
                  surveyInfo={surveyInfo}
                  surveyCycleKey={surveyCycleKey}
                  nodeDef={childDef}
                  parentNode={node}
                  canEditDef={canEditDef}
                  canEditRecord={canEditRecord}
                  canAddNode={canAddNode}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
    )
    : null
}

const NodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode, getNodeKeyLabelValues,
    updateNode, removeNode, onChange, canEditRecord, canAddNode
  } = props

  const i18n = useI18n()

  return (
    <div className="survey-form__node-def-entity-form-header">

      <select className="node-select"
              value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
              onChange={e => onChange(e.target.value)}
              aria-disabled={R.isEmpty(nodes)}>
        <option value='placeholder' disabled hidden={true}>{i18n.t('surveyForm.nodeDefEntityForm.select')}</option>
        {
          nodes.map(n =>
            <option key={Node.getUuid(n)}
                    value={Node.getUuid(n)}>
              {getNodeKeyLabelValues(nodeDef, n)}
            </option>
          )
        }
      </select>

      {
        canEditRecord &&
        <React.Fragment>
          <button className="btn btn-s"
                  style={{ marginLeft: '5px' }}
                  aria-disabled={!selectedNode}
                  onClick={() => {
                    if (window.confirm(i18n.t('surveyForm.nodeDefEntityForm.confirmDelete'))) {
                      onChange(null)
                      removeNode(nodeDef, selectedNode)
                    }
                  }}>
            <span className="icon icon-bin icon-10px icon-left"/>
            {i18n.t('common.delete')}
          </button>
          <button className="btn btn-s"
                  style={{ marginLeft: '50px' }}
                  onClick={() => {
                    const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
                    updateNode(nodeDef, entity)
                    onChange(Node.getUuid(entity))
                  }}
                  aria-disabled={!canAddNode}>
            <span className="icon icon-plus icon-10px icon-left"/>
            {i18n.t('common.add')}
          </button>
        </React.Fragment>
      }
    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  checkNodePage () {
    const { nodeDef, setFormPageNode, nodes, entry } = this.props

    if (entry && !NodeDef.isMultiple(nodeDef)) {
      const nodeUuid = R.pipe(
        R.head,
        R.prop('uuid')
      )(nodes)

      setFormPageNode(nodeDef, nodeUuid)
    }
  }

  componentDidMount () {
    this.checkNodePage()
  }

  componentDidUpdate (prevProps, prevState) {
    const { nodeDef } = this.props
    const { nodeDef: prevNodeDef } = prevProps
    if (NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(prevNodeDef))
      this.checkNodePage()
  }

  render () {
    const {
      nodeDef,
      edit, entry, entryMultiple,
      parentNode, nodes, selectedNode,
      setFormPageNode, getNodeKeyLabelValues,
    } = this.props

    return (
      <div>

        <NodeDefErrorBadge
          nodeDef={nodeDef}
          edit={edit}
          parentNode={parentNode}
          nodes={nodes}
        />

        {
          entryMultiple &&
          <NodeSelect
            {...this.props}
            selectedNode={selectedNode}
            getNodeKeyLabelValues={getNodeKeyLabelValues}
            onChange={selectedNodeUuid => setFormPageNode(nodeDef, selectedNodeUuid)}
          />
        }

        {
          entry && selectedNode &&
          <EntityForm {...this.props} node={selectedNode}/>
        }

        {
          edit &&
          <EntityForm {...this.props} node={null}/>
        }

      </div>
    )

  }
}

NodeDefEntityForm.defaultProps = {
  nodeDef: null,
  // entry props
  entry: false,
  entryMultiple: false,
  nodes: null,
  selectedNode: null,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, nodes, entry } = props

  const getEntryProps = () => {
    const entryMultiple = NodeDef.isMultiple(nodeDef)
    const record = RecordState.getRecord(state)

    const selectedNodeUuid = entryMultiple
      ? SurveyFormState.getFormPageNodeUuid(nodeDef)(state)
      : Node.getUuid(nodes[0])

    const selectedNode = selectedNodeUuid
      ? Record.getNodeByUuid(selectedNodeUuid)(record)
      : null

    return {
      entryMultiple,
      selectedNode,
    }
  }

  return entry
    ? getEntryProps()
    : {}
}

export default connect(
  mapStateToProps,
  { setFormPageNode, getNodeKeyLabelValues }
)(NodeDefEntityForm)