import React from 'react'
import * as R from 'ramda'

import { getNodeValue, newNodePlaceholder } from '../../../../../common/record/node'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({nodeDef, parentNode, nodes, updateNode, label, disabled, value, edit}) => {
  const node = edit
    ? null
    : R.isEmpty(nodes)
      ? newNodePlaceholder(nodeDef, parentNode)
      : nodes[0]

  const nodeValue = getNodeValue(node, 'false')

  return (
    <button className="btn btn-s btn-transparent"
            style={{borderRadius: '.75rem'}}
            aria-disabled={disabled}
            onClick={() => updateNode(nodeDef, node, value, parentNode)}>
      <span className={`icon icon-radio-${nodeValue === value ? 'checked2' : 'unchecked'} icon-left`}/>
      {label}
    </button>
  )

}

const NodeDefBoolean = props => {
  const {edit, renderType, label} = props

  if (renderType === nodeDefRenderType.tableHeader)
    return <label className="node-def__table-header">
      {label}
    </label>

  return (
    <NodeDefFormItem {...props}>
      <div className="form-input" style={{borderBottom: 'none'}}>

        <Button {...props}
                disabled={edit}
                label="YES"
                value="true"/>

        <Button {...props}
                disabled={edit}
                label="NO"
                value="false"/>

      </div>
    </NodeDefFormItem>
  )

}

export default NodeDefBoolean
