import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import Survey from '../../../../../../../core/survey/survey'
import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'

import * as SurveyState from '../../../../../../survey/surveyState'

const componentsByRenderType = {
  [NodeDefLayout.renderType.form]: NodeDefEntityForm,
  [NodeDefLayout.renderType.table]: NodeDefEntityTable,
}

const NodeDefEntitySwitch = props => {

  const { surveyCycleKey, nodeDef } = props
  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)

  return renderType && React.createElement(componentsByRenderType[renderType], props)
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(SurveyState.getSurvey(state)),
})

export default connect(mapStateToProps)(NodeDefEntitySwitch)