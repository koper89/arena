import './variablesSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

import * as SurveyState from '../../../../survey/surveyState'
import * as NodeDefUiProps from '../../../surveyForm/nodeDefs/nodeDefSystemProps'

class Variables extends React.Component {
  render () {
    const {
      nodeDefParent, childDefs, lang,
      nodeDefVariableUuids, toggleNodeDefVariable
    } = this.props

    return childDefs
      ? (
        <React.Fragment>
          {
            childDefs.map(
              childDef => {
                const childDefUuid = NodeDef.getUuid(childDef)

                return NodeDef.isNodeDefEntity(childDef)
                  ? null
                  : (
                    <button key={childDefUuid}
                            className={`btn btn-s btn-of-light btn-node-def${R.includes(childDefUuid, nodeDefVariableUuids) ? ' active' : ''}`}
                            onClick={() => toggleNodeDefVariable(childDefUuid)}>
                      {NodeDef.getNodeDefLabel(childDef, lang)}
                      {NodeDefUiProps.getNodeDefIconByType(NodeDef.getNodeDefType(childDef))}
                    </button>
                  )
              }
            )
          }

          {
            nodeDefParent &&
            <React.Fragment>
              <div className="node-def-label">{NodeDef.getNodeDefLabel(nodeDefParent, lang)}</div>
              <VariablesConnect nodeDefUuid={NodeDef.getUuid(nodeDefParent)}
                                lang={lang}
                                nodeDefVariableUuids={nodeDefVariableUuids}
                                toggleNodeDefVariable={toggleNodeDefVariable}/>
            </React.Fragment>
          }

        </React.Fragment>
      )
      : null
  }
}

Variables.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

const mapStateToProps = (state, props) => {
  const {nodeDefUuid} = props
  const survey = SurveyState.getSurvey(state)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const childDefs = nodeDefUuid
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  return {
    nodeDefParent,
    childDefs,
  }
}
const VariablesConnect = connect(mapStateToProps)(Variables)

class VariablesSelector extends React.PureComponent {

  constructor (props) {
    super(props)
    this.state = {nodeDefVariableUuids: []}
  }

  toggleNodeDefVariable (nodeDefUuid) {
    const {nodeDefVariableUuids: nodeDefVariableUuidsState} = this.state

    const idx = R.findIndex(R.equals(nodeDefUuid), nodeDefVariableUuidsState)
    const fn = idx >= 0 ? R.remove(idx, 1) : R.append(nodeDefUuid)
    const nodeDefVariableUuids = fn(nodeDefVariableUuidsState)

    this.updateNodeDefVariableUuids(nodeDefVariableUuids)
  }

  updateNodeDefVariableUuids (nodeDefVariableUuids) {
    this.setState({nodeDefVariableUuids})
    this.props.onChange(nodeDefVariableUuids)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDefUuid} = this.props
    const {nodeDefUuid: nodeDefUuidPrev} = prevProps
    if (nodeDefUuid !== nodeDefUuidPrev)
      this.updateNodeDefVariableUuids([])
  }

  render () {
    const {nodeDefUuid, lang} = this.props
    const {nodeDefVariableUuids} = this.state

    return (
      <VariablesConnect nodeDefUuid={nodeDefUuid} lang={lang}
                        nodeDefVariableUuids={nodeDefVariableUuids}
                        toggleNodeDefVariable={this.toggleNodeDefVariable.bind(this)}/>
    )
  }

}

VariablesSelector.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

export default VariablesSelector