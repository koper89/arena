import './components/dataQueryView.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDefsSelectorView from '../../../surveyVis/nodeDefsSelector/nodeDefsSelectorView'

import Table from './components/table'

import { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols } from './actions'
import * as DataQueryState from './dataQueryState'

class DataQueryView extends React.PureComponent {

  componentDidMount () {
    this.props.initTableData()
  }

  render () {
    const {
      nodeDefUuidEntity, nodeDefUuidsAttributes,
      updateTableNodeDefUuid, updateTableNodeDefUuidCols
    } = this.props

    return (
      <div className="data-query">

        <NodeDefsSelectorView
          nodeDefUuidEntity={nodeDefUuidEntity}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onChangeEntity={updateTableNodeDefUuid}
          onChangeAttributes={updateTableNodeDefUuidCols}
        />

        <Table/>

      </div>
    )
  }

}

DataQueryView.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
}

const mapStateToProps = state => ({
  nodeDefUuidEntity: DataQueryState.getTableNodeDefUuidTable(state),
  nodeDefUuidsAttributes: DataQueryState.getTableNodeDefUuidCols(state)
})

export default connect(
  mapStateToProps,
  { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols }
)(DataQueryView)